# @variable(model, price, Kokako.PriceState,
#     initial_value = 0.0,
#     transition_function = (p, ω) -> p′
# )

# @variable(model, price[i = 1:2], Kokako.PriceState,
#     initial_value = i,
#     transition_function = (p, ω) -> i * (p + ω)
# )

struct PriceState
    μ::JuMP.VariableRef
end

struct PriceStateInfo
    initial_value::Float64
    transition_function::Function
    lipschitz_constant::Float64
end

function JuMP.build_variable(
        _error::Function, ::JuMP.StateInfo, ::Type{PriceState};
        initial_value,
        transition_function,
        lipschitz_constant = 1e6,
        kwargs...)
    return PriceStateInfo(initial_value, transition_function, lipschitz_constant)
end

function JuMP.add_variable(
        subproblem::JuMP.Model, state_info::PriceStateInfo, name::String)
    state = State(
        JuMP.add_variable(
            subproblem, JuMP.ScalarVariable(state_info.in), name * "_in"),
        JuMP.add_variable(
            subproblem, JuMP.ScalarVariable(state_info.out), name * "_out")
    )
    node = get_node(subproblem)
    sym_name = Symbol(name)
    if haskey(node.states, sym_name)
        error("The state $(sym_name) already exists.")
    end
    node.states[sym_name] = state
    graph = get_policy_graph(subproblem)
    graph.initial_root_state[sym_name] = state_info.initial_value
    return state
end

JuMP.variable_type(model::JuMP.Model, ::Type{PriceState}) = PriceState

function JuMP.value(state::PriceState{JuMP.VariableRef})
    return State(JuMP.value(state.in), JuMP.value(state.out))
end
