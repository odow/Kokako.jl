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
            lower_bound = 0.0, upper_bound = 1.0, lipschitz = 5.0) do y, ω
                return y + ω
        end

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
            λ = Kokako.objective_state(subproblem, ω.λ)
            @stageobjective(subproblem, λ * objective_1 + (1 - λ) * objective_2)
        end
    end
    Kokako.train(model, iteration_limit = 10, print_level = 0)
    # @test Kokako.calculate_bound(model) == 10
end

biobjective_hydro()
