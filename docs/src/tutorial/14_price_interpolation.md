# Intermediate IV: price interpolation

There are many applications in which we want to model a price process that
follows some auto-regressive process. Common examples include stock prices on
financial exchanges and spot-prices in energy markets.

However, it is well known that these cannot be incorporated in to SDDP because
they result in cost-to-go functions that are convex with respect to some state
variables (e.g., the reservoir levels) and concave with respect to other state
variables (e.g., the spot price in the current stage).

To overcome this problem, the approach in the literature has been to discretize
the price process in order to model it using a Markovian policy graph like those
discussed in [Basics IV: Markov uncertainty](@ref).

## One-dimensional price processes

```jldoctest intermediate_price
using Kokako, GLPK

model = Kokako.LinearPolicyGraph(
            stages = 3, sense = :Min, lower_bound = 0.0,
            optimizer = with_optimizer(GLPK.Optimizer)
        ) do subproblem, t
    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)
    @variables(subproblem, begin
        thermal_generation >= 0
        hydro_generation   >= 0
        hydro_spill        >= 0
        inflow
    end)
    @constraints(subproblem, begin
        volume.out == volume.in + inflow - hydro_generation - hydro_spill
        demand_constraint, thermal_generation + hydro_generation == 150.0
    end)

    Kokako.add_objective_state(
            subproblem, lower_bound = 50.0, upper_bound = 150.0,
            initial_value = 50.0) do fuel_cost, ω
        return ω.fuel * fuel_cost
    end

    Ω = [
        (fuel = f, inflow = w)
        for f in [0.75, 0.9, 1.1, 1.25] for w in [0.0, 50.0, 100.0]
    ]

    Kokako.parameterize(subproblem, Ω) do ω
        fuel_cost = Kokako.objective_state(subproblem)
        @stageobjective(subproblem, fuel_cost * thermal_generation)
        JuMP.fix(inflow, ω.inflow)
    end
end

# output

A policy graph with 3 nodes.
 Node indices: 1, 2, 3
```

!!! warn
    The key assumption is that price is independent of the states and actions in
    the model. That means that the price cannot appear in any `@constraint`s.
    Nor can you use any `@variable`s in the update function.

## Multi-dimensional price process

You can construct multi-dimensional price processes using `NTuple`s. Just
replace every scalar value associated with the objective state by a tuple. For
example, `initial_value = 1.0` becomes `initial_value = (1.0, 2.0)`.

Here is an example:
```jldoctest intermediate_price
model = Kokako.LinearPolicyGraph(
            stages = 3, sense = :Min, lower_bound = 0.0,
            optimizer = with_optimizer(GLPK.Optimizer)
        ) do subproblem, t
    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)
    @variables(subproblem, begin
        thermal_generation >= 0
        hydro_generation   >= 0
        hydro_spill        >= 0
        inflow
    end)
    @constraints(subproblem, begin
        volume.out == volume.in + inflow - hydro_generation - hydro_spill
        demand_constraint, thermal_generation + hydro_generation == 150.0
    end)

    Kokako.add_objective_state(
            subproblem, lower_bound = (50.0, 50.0),
            upper_bound = (150.0, 150.0), initial_value = (50.0, 50.0)
                ) do fuel_cost, ω
        fuel_cost′ = fuel_cost[1] + 0.5 * (fuel_cost[1] - fuel_cost[2]) + ω.fuel
        return (fuel_cost′, fuel_cost[1])
    end

    Ω = [
        (fuel = f, inflow = w)
        for f in [-10.0, -5.0, 5.0, 10.0] for w in [0.0, 50.0, 100.0]
    ]

    Kokako.parameterize(subproblem, Ω) do ω
        (fuel_cost, fuel_cost_old) = Kokako.objective_state(subproblem)
        @stageobjective(subproblem, fuel_cost * thermal_generation)
        JuMP.fix(inflow, ω.inflow)
    end
end

# output

A policy graph with 3 nodes.
 Node indices: 1, 2, 3
```

!!! warn
    You need to ensure that the cost-to-go function is concave with respect to
    the objective state _before_ the update. `V(x, y) = min{Y(y)' x | Ax = b}`
    If the update function is linear, this is always the case. In some
    situations, the update function can be nonlinear (e.g., multiplicative as we
    have above). In general, placing constraints on the price (e.g.,
    `clamp(price, 0, 1)`) will destroy concavity.
    [Caveat emptor](https://en.wikipedia.org/wiki/Caveat_emptor). It's up to you
    if this is a problem. If it isn't you'll get a good heuristic with no
    guarantee of global optimality.
