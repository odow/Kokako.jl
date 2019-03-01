# Intermediate VI: stochastic processes

```jldocstring stochastic_processes
julia> using Distributions
Distributions

julia> function discretize_distribution(d::Distributions.UnivariateDistribution, N::Int)
           support = [Distributions.invlogcdf(log((2 * i - 1) / (2 * N))) for i in 1:N]
           probabilities = fill(1 / N, N)
           return support, probabilities
       end
discretize_distribution

"""
    joint_distribution(; kwargs...)

Returns a vector of the supports and a vector of the corresponding
probabilities.

### Example

    s, p = joint_distribution(
        x = [1, 2, 3] => [0.5, 0.2, 0.3],
        y = [:a, :b] => [0.9, 0.1]
    )

    s == [
        (x=1, y=:a), (x=2, y=:a), (x=3, y=:a),
        (x=1, y=:b), (x=2, y=:b), (x=3, y=:b)
    ]
    p ≈ [0.45, 0.18, 0.27, 0.05, 0.02, 0.03]
"""
function joint_distribution(; kwargs...)
    names = tuple([name for (name, arg) in kwargs]...)
    supports = [support for (name, (support, probability)) in kwargs]
    probabilities = [probability for (name, (support, probability)) in kwargs]
    output_type = NamedTuple{names, Tuple{eltype.(supports)...}}
    joint_support = output_type[output_type(arg) for arg in Base.product(supports...)]
    joint_probability = Float64[*(arg...) for arg in Base.product(probabilities...)]
    return joint_support[:], joint_probability[:]
end
```

## Additive auto-regressive processes

Return the variable `x(t)` that follows the following auto-regressive process
defined by the parameters `α`, `β`, `μ`, and `σ`:
`x(t) = α + β * x(t-1) + ϵ`,
where `ϵ ~ N(μ, σ)`.

```jldocstring stochastic_processes
using Kokako, GLPK

function add_additive_process(subproblem; α, β, μ, σ, N = 10)
    @variable(subproblem, inflow, Kokako.State, initial_value = 50)
    @variable(subproblem, ϵ)
    @constraint(subproblem, inflow.out == α + β * inflow.in + ϵ)
    support, probabilities = discretize_distribution(
        Disributions.Normal(μ, σ),
        N
    )
    Kokako.parameterize(subproblem, support, probabilities) do ω
        JuMP.fix(ϵ, ω)
    end
    return inflow.out
end
```

This function can be used within the subproblem definition as follows:
```jldocstring stochastic_processes
model = Kokako.LinearPolicyGraph(
            stages = 3,
            sense = :Min,
            lower_bound = 0.0,
            optimizer = with_optimizer(GLPK.Optimizer)
        ) do subproblem, t
    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)

    inflow = add_additive_process(subproblem, α=0, β=1, μ=0, σ=1)

    @variables(subproblem, begin
        thermal_generation >= 0
        hydro_generation   >= 0
        hydro_spill        >= 0
    end)
    @constraints(subproblem, begin
        volume.out == volume.in + inflow - hydro_generation - hydro_spill
        demand_constraint, thermal_generation + hydro_generation == 150.0
    end)
    fuel_cost = [50.0, 100.0, 150.0]
    @stageobjective(subproblem, fuel_cost[t] * thermal_generation)
end

# output

A policy graph with 3 nodes.
 Node indices: 1, 2, 3
```

```jldocstring
"""
    log_auto_regressive(subproblem; x₀, N, α = 0.0, μ=0, σ=1)

Return the variable `x(t)` that follows the following log-normal auto-regressive
process defined by the parameters `α`, `μ`, and `σ`:

`log(x(t)) = log(α) + log(x(t-1)) + ϵ`, where `ϵ ~ N(μ, σ)`.
"""
function log_auto_regressive(subproblem; x₀, N, α = 0.0, μ=0, σ=1)
    d = Disributions.Normal(μ, σ)
    support, probabilities = discretize_distribution(d, N)
    @variable(subproblem, x, Kokako.State, initial_value = x₀)
    dynamics_constraint = @constraint(subproblem, x.out == α * x.in^β)
    Kokako.parameterize(subproblem, residuals) do ω
        # Note: the constraint will be normalized to
        # inflow.out - α * inflow.in = 0, so we have to set the -ve coefficient.
        JuMP.set_coefficient(dynamics_constraint, x.in, -α * ω)
    end
    return inflow.out
end
```
