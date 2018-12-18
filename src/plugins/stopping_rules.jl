#  Copyright 2018, Oscar Dowson.
#  This Source Code Form is subject to the terms of the Mozilla Public License,
#  v. 2.0. If a copy of the MPL was not distributed with this file, You can
#  obtain one at http://mozilla.org/MPL/2.0/.

# ======================= Iteration Limit Stopping Rule ====================== #

mutable struct IterationLimit <: AbstractStoppingRule
    limit::Int
end

stopping_rule_status(::IterationLimit) = :iteration_limit

function convergence_test(
        graph::PolicyGraph, log::Vector{Log}, rule::IterationLimit)
    return log[end].iteration >= rule.limit
end

# ========================= Time Limit Stopping Rule ========================= #

mutable struct TimeLimit <: AbstractStoppingRule
    limit::Float64
end

stopping_rule_status(::TimeLimit) = :time_limit

function convergence_test(graph::PolicyGraph, log::Vector{Log}, rule::TimeLimit)
    return log[end].time >= rule.limit
end

# ========================= Statistical Stopping Rule ======================== #

# struct Statistical <: AbstractStoppingRule
#     number_replications::Int
# end
#
# stopping_rule_status(::Statistical) = :statistical
#
# function convergence_test(graph::PolicyGraph, log::Vector{Log}, rule::Statistical)
#
# end

# ======================= Bound-stalling Stopping Rule ======================= #

struct BoundStalling <: AbstractStoppingRule
    num_previous_iterations::Int
    tolerance::Float64
end

stopping_rule_status(::BoundStalling) = :bound_stalling

function convergence_test(graph::PolicyGraph{T}, log::Vector{Log},
                          rule::BoundStalling) where T
    if length(log) < rule.num_previous_iterations + 1
        return false
    end
    for iteration in 1:rule.num_previous_iterations
        idx = length(log) - iteration
        if abs(log[idx].bound - log[idx + 1].bound) > rule.tolerance
            return false
        end
    end
    return true
end
