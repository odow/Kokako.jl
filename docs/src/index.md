```@meta
CurrentModule = SDDP
```

# SDDP.jl

!!! note
    To co-incide with the release of Julia 1.0 and JuMP 0.19, `SDDP.jl`
    under-went a major re-write.

`SDDP.jl` is a package for solving large multistage convex stochastic
programming problems using *stochastic dual dynamic programming*. In this
manual, we're going to assume a reasonable amount of background knowledge about
stochastic optimization, the SDDP algorithm, Julia, and JuMP.

!!! info
    If you haven't used JuMP before, we recommend that you read the
    [JuMP documentation](http://www.juliaopt.org/JuMP.jl/latest/) and try
    building and solving JuMP models _before_ trying `SDDP.jl`.

## Installation

You can install `SDDP.jl` as follows:

```julia
import Pkg
Pkg.add("https://github.com/odow/SDDP.jl.git")
```

## Tutorials

Once you've got SDDP installed, you should read some tutorials, beginning
with [Basics I: first steps](@ref).

## Citing SDDP.jl

If you use SDDP.jl, we ask that you please cite the following
[paper](http://www.optimization-online.org/DB_FILE/2017/12/6388.pdf):
```
@article{dowson_sddp.jl,
	title = {{SDDP}.jl: a {Julia} package for stochastic dual dynamic programming},
	url = {http://www.optimization-online.org/DB_HTML/2017/12/6388.html},
	journal = {Optimization Online},
	author = {Dowson, Oscar and Kapelevich, Lea},
	year = {2017}
}
```
