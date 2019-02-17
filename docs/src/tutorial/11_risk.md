# Intermediate I: risk

```@meta
DocTestSetup = quote
    using Kokako, GLPK
end
```

## Risk measures

To illustrate the risk-measures included in `Kokako.jl`, we consider a discrete
random variable with four outcomes.

The random variable is supported on the values 1, 2, 3, and 4:

```jldoctest intermediate_risk
julia> noise_supports = [1, 2, 3, 4]
4-element Array{Int64,1}:
 1
 2
 3
 4
```

The associated probability of each outcome is as follows:

```jldoctest intermediate_risk
julia> nominal_probability = [0.1, 0.2, 0.3, 0.4]
4-element Array{Float64,1}:
 0.1
 0.2
 0.3
 0.4
```

With each outcome ω, the agent observes a cost `Z(ω)`:
```jldoctest intermediate_risk
julia> cost_realizations = [5.0, 4.0, 6.0, 2.0]
4-element Array{Float64,1}:
 5.0
 4.0
 6.0
 2.0
```

We assume that we are minimizing:
```jldoctest intermediate_risk
julia> is_minimization = true
true
```

Finally, we create a vector that will be used to store the risk-adjusted
probabilities:

```jldoctest intermediate_risk
julia> risk_adjusted_probability = zeros(4)
4-element Array{Float64,1}:
 0.0
 0.0
 0.0
 0.0
```

### Expectation

The [`Kokako.Expectation`](@ref) risk-measure takes the risk-adjusted
expectation with respect to the nominal distribution:

```jldoctest intermediate_risk
Kokako.adjust_probability(
    Kokako.Expectation(),
    risk_adjusted_probability,
    nominal_probability,
    noise_supports,
    cost_realizations,
    is_minimization
)

risk_adjusted_probability

# output

4-element Array{Float64,1}:
 0.1
 0.2
 0.3
 0.4
```

[`Kokako.Expectation`](@ref) is the default risk measure in `Kokako.jl`.

### Worst-case

The [`Kokako.WorstCase`](@ref) risk-measure places all of the weight on the
worst outcome (largest if minimizing, smallest if maximizing):

```jldoctest intermediate_risk
Kokako.adjust_probability(
    Kokako.WorstCase(),
    risk_adjusted_probability,
    nominal_probability,
    noise_supports,
    cost_realizations,
    is_minimization
)

risk_adjusted_probability

# output

4-element Array{Float64,1}:
 0.0
 0.0
 1.0
 0.0
```

### Average value at risk (AV@R)

The average value at risk [`AVaR`](@ref) measure computes the expectation of the
worst `beta` fraction of outcomes.

```jldoctest intermediate_risk
Kokako.adjust_probability(
    Kokako.AVaR(0.5),
    risk_adjusted_probability,
    nominal_probability,
    noise_supports,
    cost_realizations,
    is_minimization
)

risk_adjusted_probability

# output

4-element Array{Float64,1}:
 0.2
 0.2
 0.6
 0.0
```

### Convex combination of risk measures

Using the axioms of coherent risk measures, it is easy to show that any convex
combination of coherent risk measures is also a coherent risk measure.

```jldoctest intermediate_risk
risk_measure = 0.5 * Kokako.Expectation() + 0.5 * Kokako.WorstCase()

Kokako.adjust_probability(
    risk_measure,
    risk_adjusted_probability,
    nominal_probability,
    noise_supports,
    cost_realizations,
    is_minimization
)

risk_adjusted_probability

# output

4-element Array{Float64,1}:
 0.05
 0.1
 0.65
 0.2
```

As a special case, the [`Kokako.EAVaR`](@ref) risk-measure is a convex
combination of [`Kokako.Expectation`](@ref) and [`Kokako.AVaR`](@ref):
```jldoctest intermediate_risk
julia> risk_measure = Kokako.EAVaR(beta=0.25, lambda=2/3)
```

This is short-hand for
`lambda * Kokako.Expectation() + (1-lambda) * Kokako.AVaR(beta)`.
 As `lambda` and `beta` tend toward `1.0`, the measure becomes more risk-neutral
 (i.e. less risk averse).

### Distributionally robust

[`Kokako.DRO`](@ref)

```jldoctest intermediate_risk
Kokako.adjust_probability(
    Kokako.DRO(0.5),
    risk_adjusted_probability,
    nominal_probability,
    noise_supports,
    cost_realizations,
    is_minimization
)

risk_adjusted_probability

# output

4-element Array{Float64,1}:
 0.05
 0.1
 0.65
 0.2
```

### Wasserstein

[`Kokako.Wasserstein`](@ref)


```jldoctest intermediate_risk
risk_measure = Kokako.Wasserstein(
        with_optimizer(GLPK.Optimizer); alpha=0.5) do x, y
   return abs(x - y)
end

Kokako.adjust_probability(
    risk_measure,
    risk_adjusted_probability,
    nominal_probability,
    noise_supports,
    cost_realizations,
    is_minimization
)

risk_adjusted_probability

# output

4-element Array{Float64,1}:
 0.1
 0.1
 0.8
 0.0
```

## Training a risk-averse model

Now that we know what risk measures `Kokako.jl` supports, lets see how to train
a policy using them. There are three possible ways.

If the same risk measure is used at every node in the policy graph, we can just
pass an instance of one of the risk measures to the `risk_measure` keyword
argument of the [`Kokako.train`](@ref) function.

```julia
Kokako.train(
    model,
    risk_measure = Kokako.WorstCase(),
    iteration_limit = 10
)
```

However, if you want different risk measures at different nodes, there are two
options. First, you can pass `risk_measure` a dictionary of risk measures,
with one entry for each node. The keys of the dictionary are the indices of the
nodes.

```julia
Kokako.train(
    model,
    risk_measure = Dict(
        1 => Kokako.Expectation(),
        2 => Kokako.WorstCase()
    ),
    iteration_limit = 10
)
```

An alternative method is to pass `risk_measure` a function that takes one
argument, the index of a node, and returns an instance of a risk measure:
```julia
Kokako.train(
    model,
    risk_measure = (node_index) -> begin
        if node_index == 1
            return Kokako.Expectation()
        else
            return Kokako.WorstCase()
        end
    end,
    iteration_limit = 10
)
```

!!! note
    If you simulate the policy, the simulated value is the risk-neutral value of
    the policy.

This concludes our first intermediate tutorial.

```@meta
DocTestSetup = nothing
```
