# Intermediate IV: price interpolation

```@docs
Kokako.add_objective_state
```

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

## Multi-dimensional price process

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
            subproblem, lower_bound = (50.0, 50.0),
            upper_bound = (150.0, 150.0), initial_value = (50.0, 50.0)
                ) do fuel_cost, ω
        # fuel_cost[t] = fuel_cost[t-1] + 0.5(fuel_cost[t-1] - fuel_cost[t-2]) + ε
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
