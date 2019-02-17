var documenterSearchIndex = {"docs": [

{
    "location": "#",
    "page": "Home",
    "title": "Home",
    "category": "page",
    "text": "CurrentModule = Kokako"
},

{
    "location": "#Kokako.jl-1",
    "page": "Home",
    "title": "Kōkako.jl",
    "category": "section",
    "text": "note: Note\nSDDP.jl is currently undergoing a re-write in this repository under the name Kōkako.jl. Once completed, this package will be renamed back to SDDP.jl.Kōkako.jl is a package for solving large multistage convex stochastic programming problems using stochastic dual dynamic programming. In this manual, we\'re going to assume a reasonable amount of background knowledge about stochastic optimization, the SDDP algorithm, Julia, and JuMP.info: Info\nIf you haven\'t used JuMP before, we recommend that you read the JuMP documentation and try building and solving JuMP models before trying Kokako.jl."
},

{
    "location": "#Installation-1",
    "page": "Home",
    "title": "Installation",
    "category": "section",
    "text": "You can install Kōkako.jl as follows:import Pkg\nPkg.add(\"https://github.com/odow/Kokako.jl.git\")"
},

{
    "location": "#Tutorials-1",
    "page": "Home",
    "title": "Tutorials",
    "category": "section",
    "text": "Once you\'ve got Kōkako installed, you should read some tutorials, beginning with Basics I: first steps."
},

{
    "location": "#Citing-SDDP.jl-1",
    "page": "Home",
    "title": "Citing SDDP.jl",
    "category": "section",
    "text": "If you use SDDP.jl, we ask that you please cite the following paper:@article{dowson_sddp.jl,\n	title = {{SDDP}.jl: a {Julia} package for stochastic dual dynamic programming},\n	url = {http://www.optimization-online.org/DB_HTML/2017/12/6388.html},\n	journal = {Optimization Online},\n	author = {Dowson, Oscar and Kapelevich, Lea},\n	year = {2017}\n}"
},

{
    "location": "#Photo-credit-1",
    "page": "Home",
    "title": "Photo credit",
    "category": "section",
    "text": "Image of a Kōkako by Matt Binns."
},

{
    "location": "tutorial/01_first_steps/#",
    "page": "Basics I: first steps",
    "title": "Basics I: first steps",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/01_first_steps/#Basics-I:-first-steps-1",
    "page": "Basics I: first steps",
    "title": "Basics I: first steps",
    "category": "section",
    "text": "Hydrothermal scheduling is the most common application of stochastic dual dynamic programming. To illustrate some of the basic functionality of Kōkako.jl, we implement a very simple model of the hydrothermal scheduling problem.We consider the problem of scheduling electrical generation over three time periods in order to meet a known demand of 150 MWh in each period.There are two generators: a thermal generator, and a hydro generator. The thermal generator has a short-run marginal cost of \\$50/MWh in the first stage, \\$100/MWh in the second stage, and \\$150/MWh in the third stage. The hydro generator has a short-run marginal cost of \\$0/MWh.The hydro generator draws water from a reservoir which has a maximum capacity of 200 units. We assume that at the start of the first time period, the reservoir is full. In addition to the ability to generate electricity by passing water through the hydroelectric turbine, the hydro generator can also spill water down a spillway (bypassing the turbine) in order to prevent the water from over-topping the dam. We assume that there is no cost of spillage.The objective of the optimization is to minimize the expected cost of generation over the three time periods."
},

{
    "location": "tutorial/01_first_steps/#Mathematical-formulation-1",
    "page": "Basics I: first steps",
    "title": "Mathematical formulation",
    "category": "section",
    "text": "Let\'s take the problem described above and form a mathematical model. In any multistage stochastic programming problem, we need to identify five key features:The stages\nThe state variables\nThe control variables\nThe dynamics\nThe stage-objective"
},

{
    "location": "tutorial/01_first_steps/#Stages-1",
    "page": "Basics I: first steps",
    "title": "Stages",
    "category": "section",
    "text": "We consider the problem of scheduling electrical generation over three timeperiodsSo, we have three stages: t = 1, 2, 3. Here is a picture:(Image: Linear policy graph)Notice that the boxes form a linear graph. This will be important when we get to the code. (We\'ll get to more complicated graphs in future tutorials.)"
},

{
    "location": "tutorial/01_first_steps/#State-variables-1",
    "page": "Basics I: first steps",
    "title": "State variables",
    "category": "section",
    "text": "State variables capture the information that flows between stages. These can be harder to identify. However, in our model, the state variable is the volume of water stored in the reservoir over time.In the model below, we\'re going to call the state variable volume.Each stage t is an interval in time. Thus, we need to record the value of the state variable in each stage at two points in time: at the beginning of the stage, which we  refer to as the incoming value of the state variable; and at the end of the  state, which we refer to as the outgoing state variable.We\'re going to refer to the incoming value of volume by volume.in and the outgoing value by volume.out.Note that volume.out when t=1 is equal to volume.in when t=2.The problem description also mentions some constraints on the volume of water in the reservoir. It cannot be negative, and the maximum level is 200 units. Thus, we have 0 <= volume <= 200. Also, the description says that the initial value of water in the reservoir (i.e., volume.in when t = 1) is 200."
},

{
    "location": "tutorial/01_first_steps/#Control-variables-1",
    "page": "Basics I: first steps",
    "title": "Control variables",
    "category": "section",
    "text": "Control variables are the actions that the agent can take during a stage to change the value of the state variables. (Hence the name control.)There are three control variables in our problem.The quantity of thermal generation, which we\'re going to call thermal_generation.\nThe quantity of hydro generation, which we\'re going to call hydro_generation.\nThe quatity of water to spill, which we\'re going to call hydro_spill.All of these variables are non-negative."
},

{
    "location": "tutorial/01_first_steps/#The-dynamics-1",
    "page": "Basics I: first steps",
    "title": "The dynamics",
    "category": "section",
    "text": "The dynamics of a problem describe how the state variables evolve through time in response to the controls chosen by the agent.For our problem, the state variable is the volume of water in the reservoir. The volume of water decreases in response to water being used for hydro generation and spillage. So the dynamics for our problem are:volume.out = volume.in - hydro_generation - hydro_spillWe can also put constraints on the values of the state and control variables. For example, in our problem, there is also a constraint that the total generation must meet the demand of 150 MWh in each stage. So, we have a constraint that: hydro_generation + thermal_generation = 150."
},

{
    "location": "tutorial/01_first_steps/#The-stage-objective-1",
    "page": "Basics I: first steps",
    "title": "The stage-objective",
    "category": "section",
    "text": "The agent\'s objective is to minimize the cost of generation. So in each stage, the agent wants to minimize the quantity of thermal generation multiplied by the short-run marginal cost of thermal generation.In stage t, they want to minimize fuel_cost[t] * thermal_generation, where fuel_cost[t] is \\$50 when t=1, \\$100 when t=2, and \\$150 when t=3.We\'re now ready to construct a Kokako model. Since Kokako is intended to be very user-friendly, we\'re going to give the full code first, and then walk through some of the details. However, you should be able to read through and understand most of what is happening."
},

{
    "location": "tutorial/01_first_steps/#Creating-a-Kokako-model-1",
    "page": "Basics I: first steps",
    "title": "Creating a Kokako model",
    "category": "section",
    "text": "using Kokako, GLPK\n\nmodel = Kokako.LinearPolicyGraph(\n            stages = 3,\n            sense = :Min,\n            lower_bound = 0.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, t\n    # Define the state variable.\n    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)\n    # Define the control variables.\n    @variables(subproblem, begin\n        thermal_generation >= 0\n        hydro_generation   >= 0\n        hydro_spill        >= 0\n    end)\n    # Define the constraints\n    @constraints(subproblem, begin\n        volume.out == volume.in - hydro_generation - hydro_spill\n        thermal_generation + hydro_generation == 150.0\n    end)\n    # Define the objective for each stage `t`. Note that we can use `t` as an\n    # index for t = 1, 2, 3.\n    fuel_cost = [50.0, 100.0, 150.0]\n    @stageobjective(subproblem, fuel_cost[t] * thermal_generation)\nend\n\n# output\n\nA policy graph with 3 nodes.\n Node indices: 1, 2, 3Wasn\'t that easy! Let\'s walk through some of the non-obvious features."
},

{
    "location": "tutorial/01_first_steps/#The-keywords-in-the-[Kokako.LinearPolicyGraph](@ref)-constructor-1",
    "page": "Basics I: first steps",
    "title": "The keywords in the Kokako.LinearPolicyGraph constructor",
    "category": "section",
    "text": "Hopefully stages and sense are obvious. However, the other two are not so clear.lower_bound: you must supply a valid bound on the objective. For our problem, we know that we cannot incur a negative cost so \\$0 is a valid lower bound.optimizer: This is borrowed directly from JuMP\'s Model constructor:using JuMP\nmodel = Model(with_optimizer(GLPK.Optimizer))"
},

{
    "location": "tutorial/01_first_steps/#Creating-state-variables-1",
    "page": "Basics I: first steps",
    "title": "Creating state variables",
    "category": "section",
    "text": "State variables can be created like any other JuMP variables. Think of them as another type of variable like binary or integer. For example, to create a binary variable in JuMP, you go:@variable(subproblem, x, Bin)whereas to create a state variable you go@variable(subproblem, x, Kokako.State)Also note that you have to pass a keyword argument called initial_value that gives the incoming value of the state variable in the first stage."
},

{
    "location": "tutorial/01_first_steps/#Defining-the-stage-objective-1",
    "page": "Basics I: first steps",
    "title": "Defining the stage-objective",
    "category": "section",
    "text": "In a JuMP model, we can set the objective using @objective. For example:@objective(subproblem, Min, fuel_cost[t] * thermal_generation)Since we only need to define the objective for each stage, rather than the whole problem, we use the Kokako-provided @stageobjective.@stageobjective(subproblem, fuel_cost[t] * thermal_generation)Note that we don\'t have to specify the optimization sense (Max of Min) since this is done via the sense keyword argument of Kokako.LinearPolicyGraph."
},

{
    "location": "tutorial/01_first_steps/#Training-a-Kokako-policy-1",
    "page": "Basics I: first steps",
    "title": "Training a Kokako policy",
    "category": "section",
    "text": "Kokako models can be trained using the Kokako.train function. It accepts a number of keyword arguments. iteration_limit terminates the training after the provided number of iterations.Kokako.train returns a TrainingResults object. You can query the reason that the training stopped by calling Kokako.termination_status on this  object.training_results = Kokako.train(model; iteration_limit = 3)\n\nprintln(\"Termination status is: \", Kokako.termination_status(training_results))\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |    32.500K |    15.000K |     0.001\n         2 |    17.500K |    17.500K |     0.002\n         3 |    17.500K |    17.500K |     0.002\nTermination status is: iteration_limit"
},

{
    "location": "tutorial/01_first_steps/#Simulating-the-policy-1",
    "page": "Basics I: first steps",
    "title": "Simulating the policy",
    "category": "section",
    "text": "Once you have a trained policy, you can simulate it using Kokako.simulate. The return value from simulate is a vector with one element for each replication. Each element is itself a vector, with one element for each stage. Each element, corresponding to a particular stage in a particular replication, is a dictionary that records information from the simulation.simulations = Kokako.simulate(\n    # The trained model to simulate.\n    model,\n    # The number of replications.\n    1,\n    # A list of names to record the values of.\n    [:volume, :thermal_generation, :hydro_generation, :hydro_spill]\n)\n\nreplication = 1\nstage = 2\nsimulations[replication][stage]\n\n# output\n\nDict{Symbol,Any} with 9 entries:\n  :volume             => State{Float64}(200.0, 150.0)\n  :hydro_spill        => 0.0\n  :bellman_term       => 0.0\n  :noise_term         => nothing\n  :node_index         => 2\n  :stage_objective    => 10000.0\n  :objective_state    => nothing\n  :thermal_generation => 100.0\n  :hydro_generation   => 50.0Ignore many of the entries for now. They will be relevant later. Of interest is :volume and :thermal_generation.julia> outgoing_volume = [stage[:volume].out for stage in simulations[1]]\n3-element Array{Float64,1}:\n 200.0\n 150.0\n   0.0\n\njulia> thermal_generation = [stage[:thermal_generation] for stage in simulations[1]]\n3-element Array{Float64,1}:\n 150.0\n 100.0\n   0.0From this, we can see the optimal policy: in the first stage, use 150 MWh of thermal generation and 0 MWh of hydro generation. In the second stage, use 100 MWh of thermal and 50 Wh of hydro. In the third and final stage, use 0 MWh of thermal and 150 MWh of  hydro.This concludes our first very simple tutorial for Kokako.jl. In the next tutorial, Basics II: adding uncertainty, we will extend this problem by adding uncertainty."
},

{
    "location": "tutorial/02_adding_uncertainty/#",
    "page": "Basics II: adding uncertainty",
    "title": "Basics II: adding uncertainty",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/02_adding_uncertainty/#Basics-II:-adding-uncertainty-1",
    "page": "Basics II: adding uncertainty",
    "title": "Basics II: adding uncertainty",
    "category": "section",
    "text": "In the previous tutorial, Basics I: first steps, we created a deterministic  hydro-thermal scheduling model. In this tutorial, we extend the problem by adding uncertainty.Notably missing from our previous model were inflows. Inflows are the water that flows into the reservoir through rainfall or rivers. These inflows are uncertain, and are the cause of the main trade-off in hydro-thermal scheduling: the desire to use water now to generate cheap electricity, against the risk that future inflows will be low, leading to blackouts or expensive thermal generation.For our simple model, we assume that the inflows can be modelled by a discrete distribution with the three outcomes given in the following table:ω 0 50 100\nP(ω) 1/3 1/3 1/3The value of the noise (the random variable) is observed by the agent at the start of each stage. This makes the problem a wait-and-see or hazard-decision formulation.To represent this, we can draw the following picture. The wavy lines denote the uncertainty arriving into the start of each stage (node).(Image: Linear policy graph)In addition to adding this uncertainty to the model, we also need to modify the dynamics to include inflow:volume.out = volume.in + inflow - hydro_generation - hydro_spill"
},

{
    "location": "tutorial/02_adding_uncertainty/#Creating-a-Kokako-model-1",
    "page": "Basics II: adding uncertainty",
    "title": "Creating a Kokako model",
    "category": "section",
    "text": "To add an uncertain variable to the model, we create a new JuMP variable inflow, and then call the function Kokako.parameterize. The Kokako.parameterize function takes three arguments: the subproblem, a vector of realizations, and a corresponding vector of probabilities.using Kokako, GLPK\n\nmodel = Kokako.LinearPolicyGraph(\n            stages = 3,\n            sense = :Min,\n            lower_bound = 0.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, t\n    # Define the state variable.\n    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)\n    # Define the control variables.\n    @variables(subproblem, begin\n        thermal_generation >= 0\n        hydro_generation   >= 0\n        hydro_spill        >= 0\n        inflow\n    end)\n    # Define the constraints\n    @constraints(subproblem, begin\n        volume.out == volume.in + inflow - hydro_generation - hydro_spill\n        demand_constraint, thermal_generation + hydro_generation == 150.0\n    end)\n    # Define the objective for each stage `t`. Note that we can use `t` as an\n    # index for t = 1, 2, 3.\n    fuel_cost = [50.0, 100.0, 150.0]\n    @stageobjective(subproblem, fuel_cost[t] * thermal_generation)\n    # Parameterize the subproblem.\n    Kokako.parameterize(subproblem, [0.0, 50.0, 100.0], [1/3, 1/3, 1/3]) do ω\n        JuMP.fix(inflow, ω)\n    end\nend\n\n# output\n\nA policy graph with 3 nodes.\n Node indices: 1, 2, 3Note how we use the JuMP function JuMP.fix to set the value of the inflow variable to ω.note: Note\nKokako.parameterize can only be called once in each subproblem definition!"
},

{
    "location": "tutorial/02_adding_uncertainty/#Training-and-simulating-the-policy-1",
    "page": "Basics II: adding uncertainty",
    "title": "Training and simulating the policy",
    "category": "section",
    "text": "As in Basics I: first steps, we train the policy:training_results = Kokako.train(model; iteration_limit = 10)\n\nprintln(\"Termination status is: \", Kokako.termination_status(training_results))\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |    12.500K |     5.000K |     0.007\n         2 |    12.500K |     8.333K |     0.007\n         3 |    12.500K |     8.333K |     0.008\n         4 |    12.500K |     8.333K |     0.009\n         5 |     2.500K |     8.333K |     0.011\n         6 |     5.000K |     8.333K |     0.012\n         7 |     5.000K |     8.333K |     0.013\n         8 |    12.500K |     8.333K |     0.014\n         9 |     7.500K |     8.333K |     0.014\n        10 |     5.000K |     8.333K |     0.016\nTermination status is: iteration_limitnote: Note\nSince SDDP is a stochastic algorithm, you might get slightly different numerical results.We can also simulate the policy. Note that this time, the simulation is stochastic. One common approach to quantify the quality of the policy is to perform  a Monte Carlo simulation and then form a confidence interval for the expected cost. This confidence interval is an estimate for the upper bound.In addition to the confidence interval, we can calculate the lower bound using Kokako.calculate_bound.simulations = Kokako.simulate(model, 500)\n\nobjective_values = [\n    sum(stage[:stage_objective] for stage in sim) for sim in simulations\n]\n\nusing Statistics\n\nμ = round(mean(objective_values), digits = 2)\nci = round(1.96 * std(objective_values) / sqrt(500), digits = 2)\n\nprintln(\"Confidence interval: \", μ, \" ± \", ci)\nprintln(\"Lower bound: \", round(Kokako.calculate_bound(model), digits = 2))\n\n# output\n\nConfidence interval: 8400.00 ± 409.34\nLower bound: 8333.33In addition to simulating the primal values of variables, we can also pass Kokako.jl custom recorder functions. Each of these functions takes one argument, the JuMP subproblem, and returns anything you can compute. For example, the dual of the demand constraint (which we named demand_constraint) corresponds to the price we should charge for electricity, since it represents the cost of each additional unit of demand. To calculate this, we can gosimulations = Kokako.simulate(\n    model,\n    1,\n    custom_recorders = Dict{Symbol, Function}(\n        :price => (sp) -> JuMP.dual(sp[:demand_constraint])\n    )\n)\n\nelectricity_price = [stage[:price] for stage in simulations[1]]\n\n# output\n\n3-element Array{Float64,1}:\n  50.0\n 100.0\n  -0.0This concludes our second tutorial for Kokako.jl. In the next tutorial, Basics III: objective uncertainty, we extend the uncertainty to the fuel cost."
},

{
    "location": "tutorial/03_objective_uncertainty/#",
    "page": "Basics III: objective uncertainty",
    "title": "Basics III: objective uncertainty",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/03_objective_uncertainty/#Basics-III:-objective-uncertainty-1",
    "page": "Basics III: objective uncertainty",
    "title": "Basics III: objective uncertainty",
    "category": "section",
    "text": "In the previous tutorial, Basics II: adding uncertainty, we created a stochastic hydro-thermal scheduling model. In this tutorial, we extend the problem by adding uncertainty to the fuel costs.Previously, we assumed that the fuel cost was deterministic: \\$50/MWh in the first stage, \\$100/MWh in the second stage, and \\$150/MWh in the third stage. For this tutorial, we assume that in addition to these base costs, the actual fuel cost is correlated with the inflows.Our new model for the uncertinty is given by the following table:ω 1 2 3\nP(ω) 1/3 1/3 1/3\ninflow 0 50 100\nfuel_multiplier 1.5 1.0 0.75In stage t, the objective is not to minimizefuel_multiplier * fuel_cost[t] * thermal_generation"
},

{
    "location": "tutorial/03_objective_uncertainty/#Creating-a-Kokako-model-1",
    "page": "Basics III: objective uncertainty",
    "title": "Creating a Kokako model",
    "category": "section",
    "text": "To add an uncertain objective, we can simply call @stageobjective from inside the Kokako.parameterize function.using Kokako, GLPK\n\nmodel = Kokako.LinearPolicyGraph(\n            stages = 3,\n            sense = :Min,\n            lower_bound = 0.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, t\n    # Define the state variable.\n    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)\n    # Define the control variables.\n    @variables(subproblem, begin\n        thermal_generation >= 0\n        hydro_generation   >= 0\n        hydro_spill        >= 0\n        inflow\n    end)\n    # Define the constraints\n    @constraints(subproblem, begin\n        volume.out == volume.in + inflow - hydro_generation - hydro_spill\n        thermal_generation + hydro_generation == 150.0\n    end)\n    fuel_cost = [50.0, 100.0, 150.0]\n    # Parameterize the subproblem.\n    Ω = [\n        (inflow = 0.0, fuel_multiplier = 1.5),\n        (inflow = 50.0, fuel_multiplier = 1.0),\n        (inflow = 100.0, fuel_multiplier = 0.75)\n    ]\n    Kokako.parameterize(subproblem, Ω, [1/3, 1/3, 1/3]) do ω\n        JuMP.fix(inflow, ω.inflow)\n        @stageobjective(subproblem,\n            ω.fuel_multiplier * fuel_cost[t] * thermal_generation)\n    end\nend\n\n# output\n\nA policy graph with 3 nodes.\n Node indices: 1, 2, 3"
},

{
    "location": "tutorial/03_objective_uncertainty/#Training-and-simulating-the-policy-1",
    "page": "Basics III: objective uncertainty",
    "title": "Training and simulating the policy",
    "category": "section",
    "text": "As in the previous two tutorials, we train the policy:training_results = Kokako.train(model; iteration_limit = 10)\n\nprintln(\"Termination status is: \", Kokako.termination_status(training_results))\n\nsimulations = Kokako.simulate(model, 500)\n\nobjective_values = [\n    sum(stage[:stage_objective] for stage in sim) for sim in simulations\n]\n\nusing Statistics\n\nμ = round(mean(objective_values), digits = 2)\nci = round(1.96 * std(objective_values) / sqrt(500), digits = 2)\n\nprintln(\"Confidence interval: \", μ, \" ± \", ci)\nprintln(\"Lower bound: \", round(Kokako.calculate_bound(model), digits = 2))\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |     7.500K |     8.173K |     0.046\n         2 |    13.654K |    10.506K |     0.047\n         3 |    31.607K |    10.625K |     0.049\n         4 |    22.500K |    10.625K |     0.051\n         5 |     1.875K |    10.625K |     0.053\n         6 |     1.875K |    10.625K |     0.054\n         7 |    24.375K |    10.625K |     0.055\n         8 |    27.500K |    10.625K |     0.058\n         9 |    11.250K |    10.625K |     0.060\n        10 |    11.250K |    10.625K |     0.061\nTermination status is: iteration_limit\nConfidence interval: 11342.5 ± 753.02\nLower bound: 10625.0This concludes our third tutorial for Kokako.jl. In the next tutorial, Basics IV: Markov uncertainty, we add stagewise-dependence to the inflows using a Markov chain."
},

{
    "location": "tutorial/04_markov_uncertainty/#",
    "page": "Basics IV: Markov uncertainty",
    "title": "Basics IV: Markov uncertainty",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/04_markov_uncertainty/#Basics-IV:-Markov-uncertainty-1",
    "page": "Basics IV: Markov uncertainty",
    "title": "Basics IV: Markov uncertainty",
    "category": "section",
    "text": "In our three tutorials (Basics I: first steps, Basics II: adding uncertainty, and Basics III: objective uncertainty), we formulated a simple hydrothermal scheduling problem with stagewise-independent noise in the right-hand side of the constraints and in the objective function. Now, in this tutorial, we introduce some stagewise-dependent uncertainty using a Markov chain."
},

{
    "location": "tutorial/04_markov_uncertainty/#Formulating-the-problem-1",
    "page": "Basics IV: Markov uncertainty",
    "title": "Formulating the problem",
    "category": "section",
    "text": "In this tutorial we consider a Markov chain with two climate states: wet and dry. Each Markov state is associated with an integer, in this case the wet climate state  is Markov state 1 and the dry climate state is Markov state 2. In the wet climate state, the probability of the high inflow increases to 50%, and the probability of the low inflow decreases to 1/6. In the dry climate state, the converse happens. There is also persistence in the climate state: the probability of remaining in the current state is 75%, and the probability of transitioning to the other climate state is 25%. We assume that the first stage starts in the wet climate state.Here is a picture of the model we\'re going to implement.(Image: Markovian policy graph)There are five nodes in our graph. Each node is named by a tuple (t, i), where t is the stage for t=1,2,3, and i is the Markov state for i=1,2. As before, the wavy lines denote the stagewise-independent random variable.For each stage, we need to provide a Markov transition matrix. This is an MxN matrix, where the element A[i, j] gives the probability of transitioning from Markov state i in the previous stage to Markov state j in the current stage. The first stage is special because we assume there is a \"zero\'th\" stage which has one Markov state (the round node in the graph above). Furthermore, the number of columns in the transition matrix of a stage (i.e. the number of Markov states) must equal the number of rows in the next stage\'s transition matrix. For our example, the vector of Markov transition matrices is given by:T = Array{Float64, 2}[\n    [ 1.0 ]\',\n    [ 0.75 0.25 ],\n    [ 0.75 0.25 ; 0.25 0.75 ]\n]note: Note\nMake sure to add the \' after the first transition matrix so Julia can distinguish between a vector and a matrix."
},

{
    "location": "tutorial/04_markov_uncertainty/#Creating-a-Kokako-model-1",
    "page": "Basics IV: Markov uncertainty",
    "title": "Creating a Kokako model",
    "category": "section",
    "text": "using Kokako, GLPK\n\nΩ = [\n    (inflow = 0.0, fuel_multiplier = 1.5),\n    (inflow = 50.0, fuel_multiplier = 1.0),\n    (inflow = 100.0, fuel_multiplier = 0.75)\n]\n\nmodel = Kokako.MarkovianPolicyGraph(\n            transition_matrices = Array{Float64, 2}[\n                [ 1.0 ]\',\n                [ 0.75 0.25 ],\n                [ 0.75 0.25 ; 0.25 0.75 ]\n            ],\n            sense = :Min,\n            lower_bound = 0.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, node\n    # Unpack the stage and Markov index.\n    t, markov_state = node\n    # Define the state variable.\n    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)\n    # Define the control variables.\n    @variables(subproblem, begin\n        thermal_generation >= 0\n        hydro_generation   >= 0\n        hydro_spill        >= 0\n        inflow\n    end)\n    # Define the constraints\n    @constraints(subproblem, begin\n        volume.out == volume.in + inflow - hydro_generation - hydro_spill\n        thermal_generation + hydro_generation == 150.0\n    end)\n    # Note how we can use `markov_state` to dispatch an `if` statement.\n    probability = if markov_state == 1  # wet climate state\n        [1/6, 1/3, 1/2]\n    else  # dry climate state\n        [1/2, 1/3, 1/6]\n    end\n\n    fuel_cost = [50.0, 100.0, 150.0]\n    Kokako.parameterize(subproblem, Ω, probability) do ω\n        JuMP.fix(inflow, ω.inflow)\n        @stageobjective(subproblem,\n            ω.fuel_multiplier * fuel_cost[t] * thermal_generation)\n    end\nend\n\n# output\n\nA policy graph with 5 nodes.\n Node indices: (1, 1), (2, 1), (2, 2), (3, 1), (3, 2)"
},

{
    "location": "tutorial/04_markov_uncertainty/#Training-and-simulating-the-policy-1",
    "page": "Basics IV: Markov uncertainty",
    "title": "Training and simulating the policy",
    "category": "section",
    "text": "As in the previous three tutorials, we train the policy:training_results = Kokako.train(model; iteration_limit = 10)\n\nprintln(\"Termination status is: \", Kokako.termination_status(training_results))\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |     5.625K |     5.329K |     0.031\n         2 |    11.250K |     7.975K |     0.034\n         3 |     5.000K |     7.975K |     0.035\n         4 |    22.440K |     8.073K |     0.068\n         5 |     5.000K |     8.073K |     0.084\n         6 |     5.000K |     8.073K |     0.087\n         7 |     1.875K |     8.073K |     0.089\n         8 |    13.125K |     8.073K |     0.092\n         9 |    11.250K |     8.073K |     0.096\n        10 |     1.875K |     8.073K |     0.099\nTermination status is: iteration_limitInstead of performing a Monte Carlo simulation like the previous tutorials, we may want to simulate one particular sequence of noise realizations. This historical simulation can also be conducted by passing a Kokako.Historical sampling scheme to the sampling_scheme keyword of the Kokako.simulate function.We can confirm that the historical sequence of nodes was visited by querying the :node_index key of the simulation results.simulations = Kokako.simulate(\n    model,\n    sampling_scheme = Kokako.Historical([\n        ((1, 1), Ω[1]),\n        ((2, 2), Ω[3]),\n        ((3, 1), Ω[2])\n    ])\n)\n\n[stage[:node_index] for stage in simulations[1]]\n\n# output\n\n3-element Array{Tuple{Int64,Int64},1}:\n (1, 1)\n (2, 2)\n (3, 1)This concludes our fourth tutorial for Kokako.jl. In the next tutorial, Basics V: plotting we discuss the plotting utilities included in Kokako.jl."
},

{
    "location": "tutorial/05_plotting/#",
    "page": "Basics V: plotting",
    "title": "Basics V: plotting",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/05_plotting/#Basics-V:-plotting-1",
    "page": "Basics V: plotting",
    "title": "Basics V: plotting",
    "category": "section",
    "text": "In our previous tutorials, we formulated, solved, and simulated multistage stochastic optimization problems. However, we haven\'t really investigated what the solution looks like. Luckily, Kokako.jl includes a number of plotting tools to help us do that. In this tutorial, we explain the tools and make some pretty pictures."
},

{
    "location": "tutorial/05_plotting/#Preliminaries-1",
    "page": "Basics V: plotting",
    "title": "Preliminaries",
    "category": "section",
    "text": "First, we need to create a policy and simulate some trajectories. So, let\'s take the model from  Basics IV: Markov uncertainty, train it for 20 iterations, and then simulate 100 Monte Carlo realizations of the policy.using Kokako, GLPK\nΩ = [\n    (inflow = 0.0, fuel_multiplier = 1.5),\n    (inflow = 50.0, fuel_multiplier = 1.0),\n    (inflow = 100.0, fuel_multiplier = 0.75)\n]\nmodel = Kokako.MarkovianPolicyGraph(\n            transition_matrices = Array{Float64, 2}[\n                [1.0]\', [0.75 0.25], [0.75 0.25 ; 0.25 0.75]],\n            sense = :Min, lower_bound = 0.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, node\n    t, markov_state = node\n    @variable(subproblem, 0 <= volume <= 200, Kokako.State, initial_value = 200)\n    @variable(subproblem, thermal_generation >= 0)\n    @variable(subproblem, hydro_generation >= 0)\n    @variable(subproblem, hydro_spill >= 0)\n    @variable(subproblem, inflow)\n    @constraint(subproblem,\n        volume.out == volume.in + inflow - hydro_generation - hydro_spill)\n    @constraint(subproblem, thermal_generation + hydro_generation == 150.0)\n    probability = markov_state == 1 ? [1/6, 1/3, 1/2] : [1/2, 1/3, 1/6]\n    fuel_cost = [50.0, 100.0, 150.0]\n    Kokako.parameterize(subproblem, Ω, probability) do ω\n        JuMP.fix(inflow, ω.inflow)\n        @stageobjective(subproblem,\n            ω.fuel_multiplier * fuel_cost[t] * thermal_generation)\n    end\nend\n\nKokako.train(model, iteration_limit = 20)\n\nsimulations = Kokako.simulate(\n    model, 100,\n    [:volume, :thermal_generation, :hydro_generation, :hydro_spill])\n\nprintln(\"Completed $(length(simulations)) simulations.\")\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |    33.750K |     5.329K |     0.034\n         2 |     5.000K |     7.975K |     0.036\n         3 |    13.125K |     8.073K |     0.038\n         4 |     5.000K |     8.073K |     0.039\n         5 |     1.875K |     8.073K |     0.041\n         6 |     1.875K |     8.073K |     0.042\n         7 |    16.250K |     8.073K |     0.044\n         8 |     1.875K |     8.073K |     0.045\n         9 |     1.875K |     8.073K |     0.048\n        10 |     1.875K |     8.073K |     0.049\n        11 |     1.875K |     8.073K |     0.051\n        12 |     1.875K |     8.073K |     0.053\n        13 |    33.750K |     8.073K |     0.054\n        14 |     9.375K |     8.073K |     0.056\n        15 |     5.000K |     8.073K |     0.059\n        16 |     5.000K |     8.073K |     0.061\n        17 |    11.250K |     8.073K |     0.063\n        18 |     5.000K |     8.073K |     0.065\n        19 |     1.875K |     8.073K |     0.066\n        20 |    11.250K |     8.073K |     0.069\nCompleted 100 simulations.Great! Now we have some data in simulations to visualize."
},

{
    "location": "tutorial/05_plotting/#Spaghetti-plots-1",
    "page": "Basics V: plotting",
    "title": "Spaghetti plots",
    "category": "section",
    "text": "The first plotting utility we discuss is a spaghetti plot (you\'ll understand the name when you see the graph).To create a spaghetti plot, begin by creating a new Kokako.SpaghettiPlot instance as follows:julia> plt = Kokako.SpaghettiPlot(stages = 3, scenarios = 100)\nA spaghetti plot with 3 stages and 100 scenarios.The keyword stages gives the number of stages in the problem (in this case, 3) and the keyword scenarios gives the number of trajectories that you want to plot (in this case, 100, since that is how many Monte Carlo replications we conducted).Next, we can add plots to plt using the Kokako.add_spaghetti function.julia> Kokako.add_spaghetti(plt; title = \"Reservoir volume\") do scenario, stage\n           return simulations[scenario][stage][:volume].out\n       endThe return value of each do ... end block is a Float64 for the y-value of the scenario\'th line in stage stage.You don\'t have just return values from the simulation, you can compute things too.julia> Kokako.add_spaghetti(plt;\n               title = \"Fuel cost\", ymin = 0, ymax = 250) do scenario, stage\n           if simulations[scenario][stage][:thermal_generation] > 0\n               return simulations[scenario][stage][:stage_objective] /\n                   simulations[scenario][stage][:thermal_generation]\n           else  # No thermal generation, so return 0.0.\n               return 0.0\n           end\n       endNote that there are many keyword arguments in addition to title. For example, we fixed the minimum and maximum values of the y-axis using ymin and ymax. See the Kokako.add_spaghetti documentation for all the arguments.Having built the plot, we now need to display it.julia> Kokako.save(plt, \"spaghetti_plot.html\", open = true)This should open a webpage that looks like this one.Using the mouse, you can highlight individual trajectories by hovering over them. This makes it possible to visualize a single trajectory across multiple dimensions.If you click on the plot, then trajectories that are close to the mouse pointer are shown darker and those further away are shown lighter."
},

{
    "location": "tutorial/05_plotting/#Publication-plots-1",
    "page": "Basics V: plotting",
    "title": "Publication plots",
    "category": "section",
    "text": "Instead of the interactive Javascript plots, you can also create some publication ready plots using the Kokako.publicationplot function.!!!info     You need to install the Plots.jl     package for this to work. We used the GR backend (gr()), but any     Plots.jl backend should work.Kokako.publicationplot implements a plot recipe to create ribbon plots of each variable against the stages. The first argument is the vector of simulation dictionaries and the second argument is the dictionary key that you want to plot. Standard Plots.jl keyword arguments such as title and xlabel can be used to modify the look of each plot. By default, the plot displays ribbons of the 0-100, 10-90, and 25-75 percentiles. The dark, solid line in the middle is the median (i.e. 50\'th percentile).using Plots\nplot(\n    Kokako.publicationplot(\n        simulations,\n        data -> data[:volume].out,\n        title = \"Outgoing volume\"\n    ),\n    Kokako.publicationplot(\n        simulations,\n        data -> data[:thermal_generation],\n        title = \"Thermal generation\"\n    ),\n    xlabel = \"Stage\",\n    ylims = (0, 200),\n    layout = (1, 2),\n    margin_bottom = 5,\n    size = (1000, 300)\n)This should open a plot window with a plot that looks like:(Image: publication plot)You can save this plot as a PDF using the Plots.jl function savefig:Plots.savefig(\"my_picture.pdf\")This concludes our fifth tutorial for Kokako.jl. In our final Basics tutorial, Basics VI: words of warning we discuss some of the issues that you should be aware of when creating your own models."
},

{
    "location": "tutorial/06_warnings/#",
    "page": "Basics VI: words of warning",
    "title": "Basics VI: words of warning",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/06_warnings/#Basics-VI:-words-of-warning-1",
    "page": "Basics VI: words of warning",
    "title": "Basics VI: words of warning",
    "category": "section",
    "text": "SDDP is a powerful solution technique for multistage stochastic programming. However, there are a number of subtle things to be aware of before creating your own models."
},

{
    "location": "tutorial/06_warnings/#Numerical-stability-1",
    "page": "Basics VI: words of warning",
    "title": "Numerical stability",
    "category": "section",
    "text": "If you aren\'t aware, SDDP builds an outer-approximation to a convex function using cutting planes. This results in a formulation that is particularly hard for solvers like GLPK, Gurobi, and CPLEX to deal with. As a result, you may run into weird behavior. This behavior could includeIterations suddenly taking a long time (the solver stalled)\nSubproblems turning infeasible or unbounded after many iterations\nSolvers returning \"Numerical Error\" statuses"
},

{
    "location": "tutorial/06_warnings/#Problem-scaling-1",
    "page": "Basics VI: words of warning",
    "title": "Problem scaling",
    "category": "section",
    "text": "In almost all cases, the cause of this is poor problem scaling. For our purpose, poor problem scaling means having variables with very large numbers and variables with very small numbers in the same model.info: Info\nGurobi has an excellent set of articles on numerical issues and how to avoid them.Consider, for example, the hydro-thermal scheduling problem we have been discussing in previous tutorials.If we define the volume of the reservoir in terms of m³, then a lake might have a capacity of 10^10 m³: @variable(subproblem, 0 <= volume <= 10^10). Moreover, the cost per cubic meter might be around \\$0.05/m³. To calculate the  value of water in our reservoir, we need to multiple a variable on the order of 10^10, by one on the order of 10⁻²!. That is twelve orders of magnitude!To improve the performance of the SDDP algorithm (and reduce the chance of weird behavior), try to re-scale the units of the problem in order to reduce the largest difference in magnitude. For example, if we talk in terms of million m³, then we have a capacity of 10⁴ million m³, and a price of \\$50,000 per million m³. Now things are only one order of magnitude apart."
},

{
    "location": "tutorial/06_warnings/#Solver-choice-1",
    "page": "Basics VI: words of warning",
    "title": "Solver choice",
    "category": "section",
    "text": "If you still run into issues after re-scaling your problem, the next thing to consider is solver choice. We highly recommend using a commercial solver such as CPLEX, Gurobi, or Xpress. If you have a particularly troublesome model, you should investigate setting solver-specific options to improve the numerical stability of each solver. For example, Gurobi has a NumericFocus option."
},

{
    "location": "tutorial/06_warnings/#Choosing-an-initial-bound-1",
    "page": "Basics VI: words of warning",
    "title": "Choosing an initial bound",
    "category": "section",
    "text": "One of the important requirements when building a SDDP model is to choose an appropriate bound on the objective (lower if minimizing, upper if maximizing). However, it can be hard to choose a bound if you don\'t know the solution! (Which is very likely.)The bound should not be as large as possible (since this will help with convergence and the numerical issues discussed above), but if chosen to small, it may cut of the feasible region and lead to a sub-optimal solution.Consider the following simple model, where we first set lower_bound to 0.0.using Kokako, GLPK\n\nmodel = Kokako.LinearPolicyGraph(\n            stages = 3,\n            sense = :Min,\n            lower_bound = 0.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, t\n    @variable(subproblem, x >= 0, Kokako.State, initial_value = 2)\n    @variable(subproblem, u >= 0)\n    @variable(subproblem, v >= 0)\n    @constraint(subproblem, x.out == x.in - u)\n    @constraint(subproblem, u + v == 1.5)\n    @stageobjective(subproblem, t * v)\nend\n\nKokako.train(model, iteration_limit = 5)\n\nprintln(\"Finished training!\")\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |     6.500  |     3.000  |     0.001\n         2 |     3.500  |     3.500  |     0.001\n         3 |     3.500  |     3.500  |     0.004\n         4 |     3.500  |     3.500  |     0.004\n         5 |     3.500  |     3.500  |     0.005\nFinished training!Now consider the case when we set the lower_bound to 10.0:using Kokako, GLPK\n\nmodel = Kokako.LinearPolicyGraph(\n            stages = 3,\n            sense = :Min,\n            lower_bound = 10.0,\n            optimizer = with_optimizer(GLPK.Optimizer)\n        ) do subproblem, t\n    @variable(subproblem, x >= 0, Kokako.State, initial_value = 2)\n    @variable(subproblem, u >= 0)\n    @variable(subproblem, v >= 0)\n    @constraint(subproblem, x.out == x.in - u)\n    @constraint(subproblem, u + v == 1.5)\n    @stageobjective(subproblem, t * v)\nend\n\nKokako.train(model, iteration_limit = 5)\n\nprintln(\"Finished training!\")\n\n# output\n\n———————————————————————————————————————————————————————————————————————————————\n                        Kokako - © Oscar Dowson, 2018-19.\n———————————————————————————————————————————————————————————————————————————————\n Iteration | Simulation |      Bound |   Time (s)\n———————————————————————————————————————————————————————————————————————————————\n         1 |     6.500  |    11.000  |     0.001\n         2 |     5.500  |    11.000  |     0.002\n         3 |     5.500  |    11.000  |     0.002\n         4 |     5.500  |    11.000  |     0.003\n         5 |     5.500  |    11.000  |     0.006\nFinished training!How do we tell which is more appropriate? There are a few clues that you should look out for.The bound converges to a value above (if minimizing) the simulated cost of the policy. In this case, the problem is deterministic, so it is easy to tell. But you can also check by performing a Monte Carlo simulation like we did in Basics II: adding uncertainty.\nThe bound converges to different values when we change the bound. This is another clear give-away. The bound provided by the user is only used in the initial iterations. It should not change the value of the converged policy. Thus, if you don\'t know an appropriate value for the bound, choose an initial value, and then increase (or decrease) the value of the bound to confirm that the value of the policy doesn\'t change.\nThe bound converges to a value close to the bound provided by the user. This varies between models, but notice that 11.0 is quite close to 10.0 compared with 3.5 and 0.0.This concludes or series of basic introductory tutorials for Kokako.jl. When you\'re ready, continue to our intermediate series of tutorials, beginning with Intermediate I: risk."
},

{
    "location": "tutorial/11_risk/#",
    "page": "Intermediate I: risk",
    "title": "Intermediate I: risk",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/11_risk/#Intermediate-I:-risk-1",
    "page": "Intermediate I: risk",
    "title": "Intermediate I: risk",
    "category": "section",
    "text": "DocTestSetup = quote\n    using Kokako, GLPK\nend"
},

{
    "location": "tutorial/11_risk/#Risk-measures-1",
    "page": "Intermediate I: risk",
    "title": "Risk measures",
    "category": "section",
    "text": "To illustrate the risk-measures included in Kokako.jl, we consider a discrete random variable with four outcomes.The random variable is supported on the values 1, 2, 3, and 4:julia> noise_supports = [1, 2, 3, 4]\n4-element Array{Int64,1}:\n 1\n 2\n 3\n 4The associated probability of each outcome is as follows:julia> nominal_probability = [0.1, 0.2, 0.3, 0.4]\n4-element Array{Float64,1}:\n 0.1\n 0.2\n 0.3\n 0.4With each outcome ω, the agent observes a cost Z(ω):julia> cost_realizations = [5.0, 4.0, 6.0, 2.0]\n4-element Array{Float64,1}:\n 5.0\n 4.0\n 6.0\n 2.0We assume that we are minimizing:julia> is_minimization = true\ntrueFinally, we create a vector that will be used to store the risk-adjusted probabilities:julia> risk_adjusted_probability = zeros(4)\n4-element Array{Float64,1}:\n 0.0\n 0.0\n 0.0\n 0.0"
},

{
    "location": "tutorial/11_risk/#Kokako.Expectation",
    "page": "Intermediate I: risk",
    "title": "Kokako.Expectation",
    "category": "type",
    "text": "Expectation()\n\nThe Expectation risk measure. Identical to taking the expectation with respect to the nominal distribution.\n\n\n\n\n\n"
},

{
    "location": "tutorial/11_risk/#Expectation-1",
    "page": "Intermediate I: risk",
    "title": "Expectation",
    "category": "section",
    "text": "Kokako.ExpectationKokako.adjust_probability(\n    Kokako.Expectation(),\n    risk_adjusted_probability,\n    nominal_probability,\n    noise_supports,\n    cost_realizations,\n    is_minimization\n)\n\nrisk_adjusted_probability\n\n# output\n\n4-element Array{Float64,1}:\n 0.1\n 0.2\n 0.3\n 0.4Kokako.Expectation is the default risk measure in Kokako.jl."
},

{
    "location": "tutorial/11_risk/#Kokako.WorstCase",
    "page": "Intermediate I: risk",
    "title": "Kokako.WorstCase",
    "category": "type",
    "text": "WorstCase()\n\nThe worst-case risk measure. Places all of the probability weight on the worst outcome.\n\n\n\n\n\n"
},

{
    "location": "tutorial/11_risk/#Worst-case-1",
    "page": "Intermediate I: risk",
    "title": "Worst-case",
    "category": "section",
    "text": "Kokako.WorstCaseKokako.adjust_probability(\n    Kokako.WorstCase(),\n    risk_adjusted_probability,\n    nominal_probability,\n    noise_supports,\n    cost_realizations,\n    is_minimization\n)\n\nrisk_adjusted_probability\n\n# output\n\n4-element Array{Float64,1}:\n 0.0\n 0.0\n 1.0\n 0.0"
},

{
    "location": "tutorial/11_risk/#Kokako.AVaR",
    "page": "Intermediate I: risk",
    "title": "Kokako.AVaR",
    "category": "type",
    "text": "AVaR(β)\n\nThe average value at risk (AV@R) risk measure.\n\nComputes the expectation of the β fraction of worst outcomes. β must be in [0, 1]. When β=1, this is equivalent to the Expectation risk measure. When β=0, this is equivalent  to the WorstCase risk measure.\n\nAV@R is also known as the conditional value at risk (CV@R) or expected shortfall.\n\n\n\n\n\n"
},

{
    "location": "tutorial/11_risk/#Average-value-at-risk-(AV@R)-1",
    "page": "Intermediate I: risk",
    "title": "Average value at risk (AV@R)",
    "category": "section",
    "text": "Kokako.AVaRKokako.adjust_probability(\n    Kokako.AVaR(0.5),\n    risk_adjusted_probability,\n    nominal_probability,\n    noise_supports,\n    cost_realizations,\n    is_minimization\n)\n\nround.(risk_adjusted_probability, digits = 1)\n\n# output\n\n4-element Array{Float64,1}:\n 0.2\n 0.2\n 0.6\n 0.0"
},

{
    "location": "tutorial/11_risk/#Kokako.EAVaR",
    "page": "Intermediate I: risk",
    "title": "Kokako.EAVaR",
    "category": "function",
    "text": "EAVaR(;lambda=1.0, beta=1.0)\n\nA risk measure that is a convex combination of Expectation and Average Value @ Risk (also called Conditional Value @ Risk).\n\n    λ * E[x] + (1 - λ) * AV@R(1-β)[x]\n\nKeyword Arguments\n\nlambda: Convex weight on the expectation ((1-lambda) weight is put on the AV@R component. Inreasing values of lambda are less risk averse (more weight on expectation).\nbeta: The quantile at which to calculate the Average Value @ Risk. Increasing values of beta are less risk averse. If beta=0, then the AV@R component is the worst case risk measure.\n\n\n\n\n\n"
},

{
    "location": "tutorial/11_risk/#Convex-combination-of-risk-measures-1",
    "page": "Intermediate I: risk",
    "title": "Convex combination of risk measures",
    "category": "section",
    "text": "Using the axioms of coherent risk measures, it is easy to show that any convex combination of coherent risk measures is also a coherent risk measure. Convex combinations of risk measures can be created directly:julia> cvx_comb_measure = 0.5 * Kokako.Expectation() + 0.5 * Kokako.WorstCase()\nA convex combination of 0.5 * Kokako.Expectation() + 0.5 * Kokako.WorstCase()Kokako.adjust_probability(\n    cvx_comb_measure,\n    risk_adjusted_probability,\n    nominal_probability,\n    noise_supports,\n    cost_realizations,\n    is_minimization\n)\n\nrisk_adjusted_probability\n\n# output\n\n4-element Array{Float64,1}:\n 0.05\n 0.1\n 0.65\n 0.2As a special case, the Kokako.EAVaR risk-measure is a convex combination of Kokako.Expectation and Kokako.AVaR:julia> risk_measure = Kokako.EAVaR(beta=0.25, lambda=0.4)\nA convex combination of 0.4 * Kokako.Expectation() + 0.6 * Kokako.AVaR(0.25)Kokako.EAVaR"
},

{
    "location": "tutorial/11_risk/#Distributionally-robust-1",
    "page": "Intermediate I: risk",
    "title": "Distributionally robust",
    "category": "section",
    "text": "Kokako.jl supports two types of distrbutionally robust risk measures: the modified Χ² method of Philpott et al. (2018), and a method based on the Wasserstein distance metric."
},

{
    "location": "tutorial/11_risk/#Kokako.ModifiedChiSquared",
    "page": "Intermediate I: risk",
    "title": "Kokako.ModifiedChiSquared",
    "category": "type",
    "text": "ModifiedChiSquared(radius::Float64)\n\nThe distributionally robust SDDP risk measure of\n\nPhilpott, A., de Matos, V., Kapelevich, L. Distributionally robust SDDP. Computational Management Science (2018) 165:431-454.\n\n\n\n\n\n"
},

{
    "location": "tutorial/11_risk/#Modified-Chi-squard-1",
    "page": "Intermediate I: risk",
    "title": "Modified Chi-squard",
    "category": "section",
    "text": "Kokako.ModifiedChiSquaredKokako.adjust_probability(\n    Kokako.ModifiedChiSquared(0.5),\n    risk_adjusted_probability,\n    [0.25, 0.25, 0.25, 0.25],\n    noise_supports,\n    cost_realizations,\n    is_minimization\n)\n\nround.(risk_adjusted_probability, digits = 4)\n\n# output\n\n4-element Array{Float64,1}:\n 0.3333\n 0.0447\n 0.622\n 0.0"
},

{
    "location": "tutorial/11_risk/#Kokako.Wasserstein",
    "page": "Intermediate I: risk",
    "title": "Kokako.Wasserstein",
    "category": "type",
    "text": "Wasserstein(norm::Function, solver_factory; alpha::Float64)\n\nA distributionally-robust risk measure based on the Wasserstein distance.\n\nAs alpha increases, the measure becomes more risk-averse. When alpha=0, the measure is equivalent to the expectation operator. As alpha increases, the measure approaches the Worst-case risk measure.\n\n\n\n\n\n"
},

{
    "location": "tutorial/11_risk/#Wasserstein-1",
    "page": "Intermediate I: risk",
    "title": "Wasserstein",
    "category": "section",
    "text": "Kokako.Wassersteinrisk_measure = Kokako.Wasserstein(\n        with_optimizer(GLPK.Optimizer); alpha=0.5) do x, y\n   return abs(x - y)\nend\n\nKokako.adjust_probability(\n    risk_measure,\n    risk_adjusted_probability,\n    nominal_probability,\n    noise_supports,\n    cost_realizations,\n    is_minimization\n)\n\nround.(risk_adjusted_probability, digits = 1)\n\n# output\n\n4-element Array{Float64,1}:\n 0.1\n 0.1\n 0.8\n 0.0"
},

{
    "location": "tutorial/11_risk/#Training-a-risk-averse-model-1",
    "page": "Intermediate I: risk",
    "title": "Training a risk-averse model",
    "category": "section",
    "text": "Now that we know what risk measures Kokako.jl supports, lets see how to train a policy using them. There are three possible ways.If the same risk measure is used at every node in the policy graph, we can just pass an instance of one of the risk measures to the risk_measure keyword argument of the Kokako.train function.Kokako.train(\n    model,\n    risk_measure = Kokako.WorstCase(),\n    iteration_limit = 10\n)However, if you want different risk measures at different nodes, there are two options. First, you can pass risk_measure a dictionary of risk measures, with one entry for each node. The keys of the dictionary are the indices of the nodes.Kokako.train(\n    model,\n    risk_measure = Dict(\n        1 => Kokako.Expectation(),\n        2 => Kokako.WorstCase()\n    ),\n    iteration_limit = 10\n)An alternative method is to pass risk_measure a function that takes one argument, the index of a node, and returns an instance of a risk measure:Kokako.train(\n    model,\n    risk_measure = (node_index) -> begin\n        if node_index == 1\n            return Kokako.Expectation()\n        else\n            return Kokako.WorstCase()\n        end\n    end,\n    iteration_limit = 10\n)note: Note\nIf you simulate the policy, the simulated value is the risk-neutral value of the policy.This concludes our first intermediate tutorial.DocTestSetup = nothing"
},

{
    "location": "tutorial/12_stopping_rules/#",
    "page": "Intermediate II: stopping rules",
    "title": "Intermediate II: stopping rules",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/12_stopping_rules/#Intermediate-II:-stopping-rules-1",
    "page": "Intermediate II: stopping rules",
    "title": "Intermediate II: stopping rules",
    "category": "section",
    "text": "The theory of SDDP tells us that the algorithm converges to an optimal policy almost surely in a finite number of iterations. In practice, this number is very large. Therefore, we need some way of pre-emptively terminating SDDP when the solution is “good enough.” We call heuristics for pre-emptively terminating SDDP stopping rules."
},

{
    "location": "tutorial/12_stopping_rules/#Basic-limits-1",
    "page": "Intermediate II: stopping rules",
    "title": "Basic limits",
    "category": "section",
    "text": "The training of an SDDP policy can be terminated after a fixed number of iterations using the iteration_limit keyword.Kokako.train(model, iteration_limit = 10)The training of an SDDP policy can be terminated after a fixed number of seconds using the time_limit keyword.Kokako.train(model, time_limit = 2.0)"
},

{
    "location": "tutorial/12_stopping_rules/#Kokako.IterationLimit",
    "page": "Intermediate II: stopping rules",
    "title": "Kokako.IterationLimit",
    "category": "type",
    "text": "IterationLimit(limit::Int)\n\nTeriminate the algorithm after limit number of iterations.\n\n\n\n\n\n"
},

{
    "location": "tutorial/12_stopping_rules/#Kokako.TimeLimit",
    "page": "Intermediate II: stopping rules",
    "title": "Kokako.TimeLimit",
    "category": "type",
    "text": "TimeLimit(limit::Float64)\n\nTeriminate the algorithm after limit seconds of computation.\n\n\n\n\n\n"
},

{
    "location": "tutorial/12_stopping_rules/#Kokako.Statistical",
    "page": "Intermediate II: stopping rules",
    "title": "Kokako.Statistical",
    "category": "type",
    "text": "Statistical(; num_replications, iteration_period = 1, z_score = 1.96,\n            verbose = true)\n\nPerform an in-sample Monte Carlo simulation of the policy with num_replications replications every iteration_periods. Terminate if the deterministic bound (lower if minimizing) calls into the confidence interval for the mean of the simulated cost. If verbose = true, print the confidence interval.\n\nNote that this tests assumes that the simulated values are normally distributed. In infinite horizon models, this is almost never the case. The distribution is usually closer to exponential or log-normal.\n\n\n\n\n\n"
},

{
    "location": "tutorial/12_stopping_rules/#Kokako.BoundStalling",
    "page": "Intermediate II: stopping rules",
    "title": "Kokako.BoundStalling",
    "category": "type",
    "text": "BoundStalling(num_previous_iterations::Int, tolerance::Float64)\n\nTeriminate the algorithm once the deterministic bound (lower if minimizing, upper if maximizing) fails to improve by more than tolerance in absolute terms for more than num_previous_iterations consecutve iterations.\n\n\n\n\n\n"
},

{
    "location": "tutorial/12_stopping_rules/#Stopping-rules-1",
    "page": "Intermediate II: stopping rules",
    "title": "Stopping rules",
    "category": "section",
    "text": "In addition to the limits provided as keyword arguments, a variety of other stopping rules are available. These can be passed to Kokako.train as a vector to the stopping_rules keyword. For example:Kokako.train(model, stopping_rules = [Kokako.BoundStalling(10, 1e-4)])Here are the stopping rules implemented in Kokako.jl:Kokako.IterationLimit\nKokako.TimeLimit\nKokako.Statistical\nKokako.BoundStalling"
},

{
    "location": "tutorial/13_generic_graphs/#",
    "page": "Intermediate III: policy graphs",
    "title": "Intermediate III: policy graphs",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/13_generic_graphs/#Intermediate-III:-policy-graphs-1",
    "page": "Intermediate III: policy graphs",
    "title": "Intermediate III: policy graphs",
    "category": "section",
    "text": ""
},

{
    "location": "tutorial/14_price_interpolation/#",
    "page": "Intermediate IV: price interpolation",
    "title": "Intermediate IV: price interpolation",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/14_price_interpolation/#Intermediate-IV:-price-interpolation-1",
    "page": "Intermediate IV: price interpolation",
    "title": "Intermediate IV: price interpolation",
    "category": "section",
    "text": ""
},

{
    "location": "tutorial/15_performance/#",
    "page": "Intermediate V: performance",
    "title": "Intermediate V: performance",
    "category": "page",
    "text": ""
},

{
    "location": "tutorial/15_performance/#Intermediate-V:-performance-1",
    "page": "Intermediate V: performance",
    "title": "Intermediate V: performance",
    "category": "section",
    "text": "SDDP is a computationally intensive algorithm. In this tutorial, we give suggestions for how the computational performance can be improved."
},

{
    "location": "tutorial/15_performance/#Numerical-stability-(again)-1",
    "page": "Intermediate V: performance",
    "title": "Numerical stability (again)",
    "category": "section",
    "text": "We\'ve already discussed this in the Numerical stability section of Basics VI: words of warning. But, it\'s so important that we\'re going to say it again: improving the problem scaling is one of the best ways to improve the numerical performance of your models."
},

{
    "location": "tutorial/15_performance/#Solver-selection-1",
    "page": "Intermediate V: performance",
    "title": "Solver selection",
    "category": "section",
    "text": "The majority of the solution time is spent inside the low-level solvers. Choosing which solver (and the associated settings) correctly can lead to big speed-ups.Choose a commercial solver.\nOptions include CPLEX, Gurobi, and Xpress. Using free solvers such as CLP and GLPK isn\'t a viable approach for large problems.\nTry different solvers.Even commercial solvers can have wildly different solution times. We\'ve seen   models on which CPLEX was 50% fast than Gurobi, and vice versa.Experiment with different solver options.\nUsing the default settings is usually a good option. However, sometimes it can pay to change these. In particular, forcing solvers to use the dual simplex algorithm (e.g., Method=1 in Gurobi ) is usually a performance win."
},

{
    "location": "apireference/#",
    "page": "Reference",
    "title": "Reference",
    "category": "page",
    "text": ""
},

{
    "location": "apireference/#API-Reference-1",
    "page": "Reference",
    "title": "API Reference",
    "category": "section",
    "text": ""
},

{
    "location": "apireference/#Kokako.LinearPolicyGraph",
    "page": "Reference",
    "title": "Kokako.LinearPolicyGraph",
    "category": "function",
    "text": "LinearPolicyGraph(builder::Function; stages::Int, kwargs...)\n\nCreate a linear policy graph with stages number of stages.\n\nSee PolicyGraph for the other keyword arguments.\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.MarkovianPolicyGraph",
    "page": "Reference",
    "title": "Kokako.MarkovianPolicyGraph",
    "category": "function",
    "text": "MarkovianPolicyGraph(builder::Function;\n    transition_matrices::Vector{Array{Float64, 2}}, kwargs...)\n\nCreate a Markovian policy graph based on the transition matrices given in transition_matrices.\n\nSee PolicyGraph for the other keyword arguments.\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.PolicyGraph",
    "page": "Reference",
    "title": "Kokako.PolicyGraph",
    "category": "type",
    "text": "PolicyGraph(builder::Function, graph::Graph{T};\n            bellman_function = AverageCut,\n            optimizer = nothing,\n            direct_mode = true) where T\n\nConstruct a a policy graph based on the graph structure of graph. (See Graph for details.)\n\nExample\n\nfunction builder(subproblem::JuMP.Model, index)\n    # ... subproblem definition ...\nend\nmodel = PolicyGraph(builder, graph;\n                    bellman_function = AverageCut,\n                    optimizer = with_optimizer(GLPK.Optimizer),\n                    direct_mode = false)\n\nOr, using the Julia do ... end syntax:\n\nmodel = PolicyGraph(graph;\n                    bellman_function = AverageCut,\n                    optimizer = with_optimizer(GLPK.Optimizer),\n                    direct_mode = true) do subproblem, index\n    # ... subproblem definitions ...\nend\n\n\n\n\n\n"
},

{
    "location": "apireference/#Policy-graphs-1",
    "page": "Reference",
    "title": "Policy graphs",
    "category": "section",
    "text": "Kokako.LinearPolicyGraph\nKokako.MarkovianPolicyGraph\nKokako.PolicyGraph"
},

{
    "location": "apireference/#Kokako.@stageobjective",
    "page": "Reference",
    "title": "Kokako.@stageobjective",
    "category": "macro",
    "text": "@stageobjective(subproblem, expr)\n\nSet the stage-objective of subproblem to expr.\n\nExample\n\n@stageobjective(subproblem, 2x + y)\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.parameterize",
    "page": "Reference",
    "title": "Kokako.parameterize",
    "category": "function",
    "text": "parameterize(modify::Function,\n             subproblem::JuMP.Model,\n             realizations::Vector{T},\n             probability::Vector{Float64} = fill(1.0 / length(realizations))\n                 ) where T\n\nAdd a parameterization function modify to subproblem. The modify function takes one argument and modifies subproblem based on the realization of the noise sampled from realizations with corresponding probabilities probability.\n\nIn order to conduct an out-of-sample simulation, modify should accept arguments that are not in realizations (but still of type T).\n\nExample\n\nKokako.parameterize(subproblem, [1, 2, 3], [0.4, 0.3, 0.3]) do ω\n    JuMP.set_upper_bound(x, ω)\nend\n\n\n\n\n\n"
},

{
    "location": "apireference/#Subproblem-definition-1",
    "page": "Reference",
    "title": "Subproblem definition",
    "category": "section",
    "text": "@stageobjective\nKokako.parameterize"
},

{
    "location": "apireference/#Kokako.train",
    "page": "Reference",
    "title": "Kokako.train",
    "category": "function",
    "text": "Kokako.train(graph::PolicyGraph; kwargs...)::TrainingResults\n\nTrain the policy of the graph. Keyword arguments are\n\niterationlimit: number of iterations to conduct before termination. Defaults to 100000.\ntime_limit: number of seconds to train before termination. Defaults to Inf.\nprint_level: control the level of printing to the screen.\nsampling_scheme: a sampling scheme to use on the forward pass of the algorithm. Defaults to InSampleMonteCarlo().\n\nThere is also a special option for infinite horizon problems\n\ncyclediscretizationdelta: the maximum distance between states allowed on the forward pass.\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.termination_status",
    "page": "Reference",
    "title": "Kokako.termination_status",
    "category": "function",
    "text": "termination_status(results::TrainingResults)\n\nQuery the reason why the training stopped.\n\n\n\n\n\n"
},

{
    "location": "apireference/#Training-the-policy-1",
    "page": "Reference",
    "title": "Training the policy",
    "category": "section",
    "text": "Kokako.train\nKokako.termination_status"
},

{
    "location": "apireference/#Kokako.simulate",
    "page": "Reference",
    "title": "Kokako.simulate",
    "category": "function",
    "text": "simulate(graph::PolicyGraph,\n         number_replications::Int = 1,\n         variables::Vector{Symbol} = Symbol[];\n         sampling_scheme::AbstractSamplingScheme =\n             InSampleMonteCarlo(),\n         custom_recorders = Dict{Symbol, Function}()\n )::Vector{Vector{Dict{Symbol, Any}}}\n\nPerform a simulation of the policy graph with number_replications replications using the sampling scheme sampling_scheme.\n\nReturns a vector with one element for each replication. Each element is a vector with one-element for each node in the scenario that was sampled. Each element in that vector is a dictionary containing information about the subproblem that was solved.\n\nIn that dictionary there are four special keys:\n\n:node_index, which records the index of the sampled node in the policy graph\n:noise_term, which records the noise observed at the node\n:stage_objective, which records the stage-objective of the subproblem\n:bellman_term, which records the cost/value-to-go of the node.\n\nThe sum of :stageobjective + :bellmanterm will equal the objective value of the solved subproblem.\n\nIn addition to the special keys, the dictionary will contain the result of JuMP.value(subproblem[key]) for each key in variables. This is useful to obtain the primal value of the state and control variables.\n\nFor more complicated data, the custom_recorders keyword arguement can be used.\n\ndata = Dict{Symbol, Any}()\nfor (key, recorder) in custom_recorders\n    data[key] = foo(subproblem)\nend\n\nFor example, to record the dual of a constraint named my_constraint, pass the following:\n\nsimulation_results = simulate(graph, number_replications=2;\n    custom_recorders = Dict(\n        :constraint_dual = (sp) -> JuMP.dual(sp[:my_constraint])\n    )\n)\n\nThe value of the dual in the first stage of the second replication can be accessed as:\n\nsimulation_results[2][1][:constraint_dual]\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.calculate_bound",
    "page": "Reference",
    "title": "Kokako.calculate_bound",
    "category": "function",
    "text": "Kokako.calculate_bound(graph::PolicyGraph, state::Dict{Symbol, Float64},\n                       risk_measure=Expectation())\n\nCalculate the lower bound (if minimizing, otherwise upper bound) of the problem graph at the point state, assuming the risk measure at the root node is risk_measure.\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.Historical",
    "page": "Reference",
    "title": "Kokako.Historical",
    "category": "type",
    "text": "Historical(scenarios::Vector{Vector{Tuple{T, S}}},\n           probability::Vector{Float64})\n\nA sampling scheme that samples a scenario from the vector of scenarios scenarios according to probability. If probability omitted, defaults to uniform probability.\n\nExample\n\nHistorical(\n    [\n        [(1, 0.5), (2, 1.0), (3, 0.5)],\n        [(1, 0.5), (2, 0.0), (3, 1.0)],\n        [(1, 1.0), (2, 0.0), (3, 0.0)]\n    ],\n    [0.2, 0.5, 0.3]\n)\n\n\n\n\n\nHistorical(scenario::Vector{Tuple{T, S}})\n\nA deterministic sampling scheme that always samples scenario with probability 1.\n\nExample\n\nHistorical([(1, 0.5), (2, 1.5), (3, 0.75)])\n\n\n\n\n\n"
},

{
    "location": "apireference/#Simulating-the-policy-1",
    "page": "Reference",
    "title": "Simulating the policy",
    "category": "section",
    "text": "Kokako.simulate\nKokako.calculate_bound\nKokako.Historical"
},

{
    "location": "apireference/#Kokako.SpaghettiPlot",
    "page": "Reference",
    "title": "Kokako.SpaghettiPlot",
    "category": "type",
    "text": "Kokako.SpaghettiPlot(; stages, scenarios)\n\nInitialize a new SpaghettiPlot with stages stages and scenarios number of replications.\n\n\n\n\n\n"
},

{
    "location": "apireference/#Kokako.add_spaghetti",
    "page": "Reference",
    "title": "Kokako.add_spaghetti",
    "category": "function",
    "text": "Kokako.add_spaghetti(data_function::Function, plt::SpaghettiPlot; kwargs...)\n\nDescription\n\nAdd a new figure to the SpaghettiPlot plt, where the y-value is given by data_function(stage, scenario) for all stages in 1:plt.stages and scenarios in 1:plt.scenarios.\n\nKeyword arguments\n\nxlabel: set the xaxis label\nylabel: set the yaxis label\ntitle: set the title of the plot\nymin: set the minimum y value\nymax: set the maximum y value\ncumulative: plot the additive accumulation of the value across the stages\ninterpolate: interpolation method for lines between stages.\n\nDefaults to \"linear\" see the d3 docs 	for all options.\n\nExamples\n\nsimulations = simulate(model, 10)\nplt = Kokako.spaghetti_plot(stages = 10, scenarios = 10)\nKokako.add_spaghetti(plt; title = \"Stage objective\") do scenario, stage\n	return simulations[scenario][stage][:stage_objective]\nend\n\n\n\n\n\n"
},

{
    "location": "apireference/#Visualizing-the-policy-1",
    "page": "Reference",
    "title": "Visualizing the policy",
    "category": "section",
    "text": "Kokako.SpaghettiPlot\nKokako.add_spaghetti"
},

]}
