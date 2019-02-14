# Tutorial Two: adding uncertainty

In the previous tutorial, [Tutorial One: first steps](@ref), we created a
deterministic  hydro-thermal scheduling model. In this tutorial, we extend the
problem by adding uncertainty.

Notably missing from our previous model were inflows. Inflows are the water that
flows into the reservoir through rainfall or rivers. These inflows are
uncertain, and are the cause of the main trade-off in hydro-thermal scheduling:
the desire to use water now to generate cheap electricity, against the risk that
future inflows will be low, leading to blackouts or expensive thermal
generation.

For our simple model, we assume that the inflows can be modelled by a discrete
distribution with the three outcomes given in the following table:

| ω    |   0 |  50 | 100 |
| ---- | --- | --- | --- |
| P(ω) | 1/3 | 1/3 | 1/3 |

In addition to adding this uncertainty to the model, we also need to modify the
dynamics to include `inflow`:

`volume.out = volume.in + inflow - hydro_generation - hydro_spill`


![Linear policy graph](assets/stochastic_linear_policy_graph.png)

## Creating a Kokako model

To add an uncertain variable to the model, we create a new JuMP variable
`inflow`, and then call the function [`Kokako.parameterize`](@ref). The
[`Kokako.parameterize`](@ref) function takes three arguments: the subproblem,
a vector of realizations, and a corresponding vector of probabilities.

```jldoctest tutorial_two
using Kokako, GLPK

model = Kokako.LinearPolicyGraph(
            stages = 3,
            sense = :Min,
            lower_bound = 0.0,
            optimizer = with_optimizer(GLPK.Optimizer)
        ) do subproblem, t
    # Define the state variable.
    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)
    # Define the control variables.
    @variables(subproblem, begin
        thermal_generation >= 0
        hydro_generation   >= 0
        hydro_spill        >= 0
        inflow
    end)
    # Define the constraints
    @constraints(subproblem, begin
        volume.out == volume.in + inflow - hydro_generation - hydro_spill
        thermal_generation + hydro_generation == 150.0
    end)
    # Define the objective for each stage `t`. Note that we can use `t` as an
    # index for t = 1, 2, 3.
    fuel_cost = [50.0, 100.0, 150.0]
    @stageobjective(subproblem, fuel_cost[t] * thermal_generation)
    # Parameterize the subproblem.
    Kokako.parameterize(subproblem, [0.0, 50.0, 100.0], [1/3, 1/3, 1/3]) do ω
        JuMP.fix(inflow, ω)
    end
end

# output

A policy graph with 3 nodes.
 Node indices: 1, 2, 3
```

Note how we use the JuMP function `JuMP.fix` to set the value of the `inflow`
variable to `ω`.

!!! note
    [`Kokako.parameterize`](@ref) can only be called once in each subproblem
    definition!

## Training and simulating the policy

As in [Tutorial One: first steps](@ref), we train the policy:
```jldoctest tutorial_two; filter=r"\|.+?\n"
training_results = Kokako.train(model; iteration_limit = 10, print_level = 1)

println("Termination status is: ", Kokako.termination_status(training_results))

# output

———————————————————————————————————————————————————————————————————————————————
                         Kokako - © Oscar Dowson, 2018.
———————————————————————————————————————————————————————————————————————————————
 Iteration | Simulation |      Bound |   Time (s)
———————————————————————————————————————————————————————————————————————————————
         1 |    12.500K |     5.000K |     0.007
         2 |    12.500K |     8.333K |     0.007
         3 |    12.500K |     8.333K |     0.008
         4 |    12.500K |     8.333K |     0.009
         5 |     2.500K |     8.333K |     0.011
         6 |     5.000K |     8.333K |     0.012
         7 |     5.000K |     8.333K |     0.013
         8 |    12.500K |     8.333K |     0.014
         9 |     7.500K |     8.333K |     0.014
        10 |     5.000K |     8.333K |     0.016
Termination status is: iteration_limit
```

!!! note
    Since SDDP is a stochastic algorithm, you might get slightly different
    numerical results.

We can also simulate the policy. Note that this time, the simulation is
stochastic. One common approach to quantify the quality of the policy is to
perform  a Monte Carlo simulation and then form a confidence interval for the
expected cost. This confidence interval is an estimate for the upper bound.

In addition to the confidence interval, we can calculate the lower bound using
[`Kokako.calculate_bound`](@ref).

```jldoctest tutorial_two; filter=r"Confidence interval.+?\n"
simulations = Kokako.simulate(model, 500)

objective_values = [
    sum(stage[:stage_objective] for stage in sim) for sim in simulations
]

using Statistics

μ = round(mean(objective_values), digits = 2)
ci = round(1.96 * std(objective_values) / sqrt(500), digits = 2)

println("Confidence interval: ", μ, " ± ", ci)
println("Lower bound: ", round(Kokako.calculate_bound(model), digits = 2))

# output

Confidence interval: 8400.00 ± 409.34
Lower bound: 8333.33
```

This concludes our second tutorial for `Kokako.jl`. In the next tutorial,
[Tutorial Three: objective uncertainty](@ref), we extend the uncertainty to the
fuel cost.