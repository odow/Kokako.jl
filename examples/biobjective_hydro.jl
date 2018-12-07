#  Copyright 2018, Oscar Dowson.
#  This Source Code Form is subject to the terms of the Mozilla Public
#  License, v. 2.0. If a copy of the MPL was not distributed with this
#  file, You can obtain one at http://mozilla.org/MPL/2.0/.

using Kokako, GLPK, Test

function biobjective_hydro()
    model = Kokako.PolicyGraph(Kokako.LinearGraph(3),
                bellman_function = Kokako.AverageCut(lower_bound = 0.0),
                optimizer = with_optimizer(GLPK.Optimizer)
                        ) do subproblem, stage
        @variable(subproblem, 0 <= v <= 200, Kokako.State, initial_value = 50)

        Kokako.add_objective_state(subproblem, initial_value = 0.0,
            lower_bound = 0.0, upper_bound = 1.0, lipschitz = 5.0)

        @variables(subproblem, begin
            0 <= g[i = 1:2] <= 100
            0 <= u <= 150
            s >= 0
            a
            shortage_cost >= 0
            objective_1
            objective_2
        end)
        @constraints(subproblem, begin
            v.out == v.in - u - s + a
            demand_eq, g[1] + g[2] + u == 150
            objective_1 == g[1] + 10 * g[2]
            shortage_cost >= 40 - v
            shortage_cost >= 60 - 2v
            shortage_cost >= 80 - 4v
            objective_2 == shortage_cost
        end)
        price_noise_terms = (stage == 1) ? collect(0:0.005:1) : [0.0]
        Ω = [(a = i, λ = j) for i in 0.0:5:50.0, j in price_noise_terms]
        Kokako.parameterize(sp, Ω) do ω
            JuMP.fix(a, ω.a)
            # This *has* to be called from inside `Kokako.parameterize`,
            # otherwise it doesn't make sense.
            λ = Kokako.objective_state(subproblem) do λ
                return λ + ω.λ
            end
            @stageobjective(subproblem, λ * objective_1 + (1 - λ) * objective_2)
        end
    end

    Kokako.train(model, iteration_limit = 10, print_level = 0)

    @test Kokako.calculate_bound(model) == 10
end

biobjective_hydro()

function create_value_function(stage, markov_state)
    return DynamicPriceInterpolation(
        dynamics = (p, ω) -> p + ω,
        initial_price = 0.0,
        min_price = 0.0,
        max_price = 1.0,
        noise = DiscreteDistribution((stage == 1) ? )
    )
end

model = SDDPModel(
            sense = :Min,
            stages = 3,
            solver = GLPK.Optimizer,
            objective_bound = 0,
            value_function = create_value_function
        ) do subproblem, stage
end


# solve_status = solve(model,
#     iteration_limit = 50
# )
#
# objective_1 = Float64[]
# objective_2 = Float64[]
# for λ in 0:0.05:1
#     subproblem = model.stages[1].subproblems[1]
#     SDDP.setobjective!(subproblem, 0.0, λ)
#     SDDP.passpriceforward!(model, subproblem)
#     SDDP.JuMPsolve(SDDP.ForwardPass, model, subproblem)
#     push!(objective_1, JuMP.getvalue(subproblem[:objective_1]))
#     push!(objective_2, JuMP.getvalue(subproblem[:objective_2]))
# end
#
# p = sortperm(objective_1)
# permute!(objective_1, p)
# permute!(objective_2, p)
# p = sortperm(objective_2, rev = true)
# permute!(objective_1, p)
# permute!(objective_2, p)
#
# using Plots
# plot(objective_1, objective_2,
#     xlabel = "Objective 1: Thermal cost", ylabel = "Objective 2: Shortage risk",
#     legend = false, width = 3
# )
#
# savefig("pareto.png")
