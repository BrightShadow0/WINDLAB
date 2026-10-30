
# WINDLAB
### Interactive Wind Turbine Simulation & Comparative Analysis

WINDLAB is an interactive 3D simulation platform designed to compare conventional Horizontal Axis Wind Turbines (HAWTs) with a bio-inspired, two-panel twisted Vertical Axis Wind Turbine (VAWT).

The platform allows users to experiment with changing wind conditions and analyse their effects on rotational speed, aerodynamic efficiency, electrical power generation and estimated noise levels through interactive visualisations.

## Features

- **Interactive 3D Models:** Explore conventional three-bladed HAWTs and bio-inspired twisted-panel VAWTs.
- **Turbine Switching:** Switch between turbine designs without leaving the simulation.
- **Wind Simulation:** Adjust wind speed, direction and turbulence.
- **Performance Analysis:** Monitor RPM, aerodynamic efficiency and electrical output.
- **Noise Analysis:** Compare estimated acoustic performance under different conditions.
- **Wind Direction Challenge:** Investigate turbine behaviour under changing wind directions.
- **Performance Graphs:** Visualise power, efficiency, noise and directional performance.
- **Component Inspection:** Explore individual turbine components through interactive 3D models.
- **Real-Time Visualisation:** Observe blade rotation and animated airflow as simulation parameters change.

## Turbine Comparison

| Parameter | Conventional HAWT | Bio-inspired VAWT |
|---|---|---|
| Axis | Horizontal | Vertical |
| Blade design | Three aerodynamic blades | Two twisted panels |
| Wind alignment | Yaw mechanism | No yaw alignment required |
| Direction sensitivity | Depends on yaw control | Depends on rotor geometry |
| Generator placement | Nacelle | Near rotor base |

## Technology Stack

- React
- Vite
- JavaScript / TypeScript
- Three.js
- React Three Fiber
- Drei
- Recharts / Chart.js
- CSS

## Simulation Models

WINDLAB uses mathematical models and turbine reference data to estimate performance under different wind conditions.

**Available Wind Power**

\[
P_{wind}=\frac{1}{2}\rho Av^3
\]

**Aerodynamic Power**

\[
P_{rotor}=C_pP_{wind}
\]

**Electrical Power**

\[
P_{electrical}=P_{rotor}\times\eta_g\times\eta_d
\]

**Electrical Efficiency**

\[
\eta_e=\frac{P_{electrical}}{P_{wind}}\times100
\]

Where:

- \(\rho\) = air density (kg/m³)
- \(A\) = rotor swept area (m²)
- \(v\) = wind speed (m/s)
- \(C_p\) = aerodynamic power coefficient
- \(\eta_g\) = generator efficiency
- \(\eta_d\) = drivetrain efficiency

The aerodynamic coefficient should vary with operating conditions and tip-speed ratio. The simulation should also account for cut-in and cut-out wind speeds, rotor dynamics and generator load.

## Reference Data and Implementation

The simulation can use publicly available turbine specifications and wind datasets to make its inputs and performance models more representative of real systems.

### HAWT Reference

The NREL 5-MW Reference Wind Turbine provides a documented baseline for a conventional three-bladed turbine.

Selected reference parameters:

| Parameter | Reference value |
|---|---:|
| Rated power | 5 MW |
| Rotor diameter | 126 m |
| Hub height | 90 m |
| Cut-in wind speed | 3 m/s |
| Rated wind speed | 11.4 m/s |
| Cut-out wind speed | 25 m/s |
| Rated rotor speed | 12.1 RPM |
| Design tip-speed ratio | 7.55 |

These values describe a particular utility-scale reference model, not every commercial HAWT. The NREL Turbine Archive also provides downloadable turbine power and thrust curves, including curves based on power-performance measurements. The documentation for each selected turbine should be checked before using its data.

### Wind Resource Data

The India Wind Dataset, available through the National Laboratory of the Rockies, provides wind speed, wind direction, temperature and pressure data at multiple heights. Its listed spatial resolution is 3 km and temporal resolution is 5 minutes.

This dataset can provide realistic wind-condition inputs for simulations. Its values are modelled gridded data, not direct measurements at every location.

### VAWT Reference

Sandia National Laboratories published research and performance measurements for its 34-metre vertical-axis wind turbine test bed.

This research can provide a reference for VAWT aerodynamic behaviour. However, the Sandia test turbine is not the same design as WINDLAB's two-panel twisted VAWT. Its performance data should not be directly treated as measured performance for the custom design.

### Noise Reference

The US Department of Energy documents the main sources of wind turbine noise, including aerodynamic noise from blades and mechanical noise from components such as generators and gearboxes.

Noise estimates in WINDLAB should account for operating speed, aerodynamic loading, turbulence and ambient noise. Published sound levels should only be used as contextual benchmarks when the turbine scale and measurement distance are comparable.

### Data Handling

- Preserve the source, units, measurement height and time resolution of imported datasets.
- Distinguish measured data, modelled wind data and reference turbine specifications.
- Use equivalent swept areas and identical environmental conditions when comparing turbine performance.
- Avoid transferring the performance curve of one turbine directly to a different turbine geometry.
- Keep estimated values clearly distinguishable from measured values.

## Getting Started

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd WINDLAB
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Objective

The primary objective is to investigate whether a bio-inspired twisted VAWT offers advantages in omnidirectional operation, noise reduction and energy generation compared with conventional wind turbines.

WINDLAB provides an interactive environment for exploring these possibilities through simulated wind conditions, mathematical models, published reference data and comparative performance analysis.

## Future Scope

- More advanced aerodynamic modelling.
- Improved airflow and turbulence visualisation.
- Configurable blade geometry.
- Improved noise estimation models.
- Additional turbine configurations.
- Integration of further publicly available wind and turbine performance datasets.
- More detailed performance analysis.

## Scientific Disclaimer

WINDLAB is an educational simulation platform. Its performance and noise values are model-based estimates, not actual experimental measurements or validated CFD results. Published reference data does not necessarily represent the custom VAWT geometry used in this project. Outcomes depend on the assumptions, parameters and datasets used. No turbine design is assumed to be universally superior.

## References

1. Jonkman, J., Butterfield, S., Musial, W. and Scott, G. (2009). *Definition of a 5-MW Reference Wind Turbine for Offshore System Development.* National Renewable Energy Laboratory, NREL/TP-500-38060.  
   https://www.nrel.gov/docs/fy09osti/38060.pdf

2. National Laboratory of the Rockies. *NREL Turbine Archive.* Public turbine specifications and power and thrust curve data.  
   https://natlabrockies.github.io/turbine-models/

3. National Laboratory of the Rockies. *Wind Toolkit Data Downloads.* Includes the India Wind Dataset.  
   https://developer.nlr.gov/docs/wind/wind-toolkit/

4. Berg, D. E. (1988). *Aerodynamic Design and Initial Performance Measurements for the SANDIA 34-Metre Diameter Vertical-Axis Wind Turbine.* Sandia National Laboratories, SAND1989-2597C.  
   https://www.sandia.gov/research/publications/details/aerodynamic-design-and-initial-performance-measurements-for-the-sandia-34-m-1990-01-01/

5. U.S. Department of Energy. *Wind Turbine Sound.* WINDExchange.  
   https://www.energy.gov/cmei/systems/windexchange/sound

## Credits

- **National Laboratory of the Rockies (NLR/NREL):** Reference turbine specifications, turbine performance data and wind resource datasets.
- **Sandia National Laboratories:** Published vertical-axis wind turbine research and performance measurements.
- **U.S. Department of Energy:** Wind turbine acoustic information and educational resources.
- **WINDLAB:** Original website implementation, custom turbine visualisation and simulation interface.
