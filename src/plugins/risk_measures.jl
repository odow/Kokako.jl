#  Copyright 2018, Oscar Dowson.
#  This Source Code Form is subject to the terms of the Mozilla Public License,
#  v. 2.0. If a copy of the MPL was not distributed with this file, You can
#  obtain one at http://mozilla.org/MPL/2.0/.

# ========================== The Expectation Operator ======================== #

struct Expectation <: AbstractRiskMeasure end

function adjust_probability(measure::Expectation,
                            risk_adjusted_probability::Vector{Float64},
                            original_probability::Vector{Float64},
                            noise_support::Vector,
                            objective_realizations::Vector{Float64},
                            is_minimization::Bool)
    risk_adjusted_probability .= original_probability
    return
end

# ========================== The Worst Case Operator ========================= #

struct WorstCase <: AbstractRiskMeasure end

function adjust_probability(measure::WorstCase,
                            risk_adjusted_probability::Vector{Float64},
                            original_probability::Vector{Float64},
                            noise_support::Vector,
                            objective_realizations::Vector{Float64},
                            is_minimization::Bool)
    risk_adjusted_probability .= 0.0
    worst_index = 1
    worst_observation = is_minimization ? -Inf : Inf
    for (index, (probability, observation)) in enumerate(
            zip(original_probability, objective_realizations))
        if probability > 0.0
            if (is_minimization && observation > worst_observation) ||
                    (!is_minimization && observation < worst_observation)
                worst_index = index
                worst_observation = observation
            end
        end
    end
    risk_adjusted_probability[worst_index] = 1.0
    return
end

# =================================== AV@R =================================== #

struct AVaR <: AbstractRiskMeasure
    β::Float64
    function AVaR(β::Float64)
        if !(0 <= β <= 1)
            throw(ArgumentError(
                "Risk-quantile β must be in [0, 1]. Currently it is $(β)."))
        end
        return new(β)
    end
end

function adjust_probability(measure::AVaR,
                            risk_adjusted_probability::Vector{Float64},
                            original_probability::Vector{Float64},
                            noise_support::Vector,
                            objective_realizations::Vector{Float64},
                            is_minimization::Bool)
     if measure.β ≈ 0.0
         return adjust_probability(
            WorstCase(), risk_adjusted_probability, original_probability,
            noise_support, objective_realizations, is_minimization)
     elseif measure.β ≈ 1.0
         return adjust_probability(
            Expectation(), risk_adjusted_probability, original_probability,
            noise_support, objective_realizations, is_minimization)
     end
     risk_adjusted_probability .= 0.0
     quantile_collected = 0.0
     for i in sortperm(objective_realizations, rev = is_minimization)
         quantile_collected >= measure.β && break
         avar_prob = min(
                original_probability[i],
                measure.β - quantile_collected
            ) / measure.β
         risk_adjusted_probability[i] = avar_prob
         quantile_collected += avar_prob * measure.β
    end
    return
end

# ============================ ConvexCombination ============================= #

"""
    ConvexCombination((weight::Float64, measure::AbstractRiskMeasure)...)

Create a weighted combination of risk measures.

### Examples

    Kokako.ConvexCombination(
        (0.5, Kokako.Expectation()),
        (0.5, Kokako.AVaR(0.25))
    )

Convex combinations can also be constructed by adding weighted risk measures
together as follows:

    0.5 * Kokako.Expectation() + 0.5 * Kokako.AVaR(0.5)
"""
struct ConvexCombination{T<:Tuple} <: AbstractRiskMeasure
    measures::T
end
ConvexCombination(args::Tuple...) = ConvexCombination(args)

import Base: +, *

function Base.:+(a::ConvexCombination, b::ConvexCombination)
    return ConvexCombination(a.measures..., b.measures...)
end

function Base.:*(lhs::Float64, rhs::AbstractRiskMeasure)
    return ConvexCombination(((lhs, rhs),))
end

function adjust_probability(measure::ConvexCombination,
                            risk_adjusted_probability::Vector{Float64},
                            original_probability::Vector{Float64},
                            noise_support::Vector,
                            objective_realizations::Vector{Float64},
                            is_minimization::Bool)
    risk_adjusted_probability .= 0.0
    partial_distribution = similar(risk_adjusted_probability)
    for (weight, measure) in measure.measures
        partial_distribution .= 0.0
        adjust_probability(
            measure, partial_distribution, original_probability, noise_support,
            objective_realizations, is_minimization)
        risk_adjusted_probability .+= weight * partial_distribution
    end
end

# =================================== EAV@R ================================== #

"""
    EAVaR(;lambda=1.0, beta=1.0)

A risk measure that is a convex combination of Expectation and Average Value @
Risk (also called Conditional Value @ Risk).

        λ * E[x] + (1 - λ) * AV@R(1-β)[x]

### Keyword Arguments

* `lambda`: Convex weight on the expectation (`(1-lambda)` weight is put on the
  AV@R component. Inreasing values of `lambda` are less risk averse (more
  weight on expectation).

* `beta`: The quantile at which to calculate the Average Value @ Risk.
  Increasing values of `beta` are less risk averse. If `beta=0`, then the AV@R
  component is the worst case risk measure.
"""
function EAVaR(;lambda::Float64=1.0, beta::Float64=1.0)
    if !(0.0 <= lambda <= 1.0)
        error("Lambda must be in the range [0, 1]. Increasing values of " *
              "lambda are less risk averse. lambda=1 is identical to taking " *
              "the expectation.")
    end
    if !(0.0 <= beta <= 1.0)
        error("Beta must be in the range [0, 1]. Increasing values of beta " *
              "are less risk averse. lambda=1 is identical to taking the " *
              "expectation.")
    end
    return lambda * Expectation() + (1 - lambda) * AVaR(beta)
end
