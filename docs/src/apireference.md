# API Reference

## Policy graphs

```@docs
Kokako.Graph
Kokako.add_node
Kokako.add_edge
Kokako.LinearGraph
Kokako.MarkovianGraph
Kokako.LinearPolicyGraph
Kokako.MarkovianPolicyGraph
Kokako.PolicyGraph
```

## Subproblem definition

```@docs
@stageobjective
Kokako.parameterize
Kokako.add_objective_state
Kokako.objective_state
```

## Training the policy

```@docs
Kokako.numerical_stability_report
Kokako.train
Kokako.termination_status
```

## Simulating the policy

```@docs
Kokako.simulate
Kokako.calculate_bound
Kokako.Historical
```

## Visualizing the policy

```@docs
Kokako.SpaghettiPlot
Kokako.add_spaghetti
Kokako.publication_plot
```
