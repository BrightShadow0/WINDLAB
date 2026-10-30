# WINDLAB
### Interactive 3D Wind-Turbine Simulation and Comparative Analysis

WINDLAB is an educational simulator comparing a conventional three-bladed horizontal-axis wind turbine (HAWT) with a custom two-panel twisted vertical-axis wind turbine (VAWT). It combines an interactive Three.js scene, adjustable wind conditions, reduced-order rotor dynamics and dynamically generated performance plots.

## Run locally
```bash
npm install
npm run dev
```
Build and preview:
```bash
npm run build
npm run preview
```

## Features
- Interactive HAWT and two opposing twisted VAWT panels with orbit, zoom and camera views.
- Wind speed (0–25 m/s), direction, turbulence intensity, air density and generator-load controls.
- HAWT automatic yaw alignment and fixed-heading modes.
- Rotor angular dynamics driven by aerodynamic torque, generator-load torque and mechanical losses.
- Tip-speed-ratio-dependent Cp, cut-in/cut-out protection and HAWT yaw-misalignment penalty.
- Live RPM, available wind power, aerodynamic power, electrical output, Cp, estimated noise and accumulated energy.
- Calculated power, Cp, noise and wind-power-density envelopes.
- HAWT/VAWT comparison and model transparency notes.

## Model equations
Available wind power: `Pwind = 0.5 × ρ × A × v³`

Rotor power: `Protor = Cp(λ) × Pwind`

Tip-speed ratio: `λ = ωR/v`

Electrical output: `Pelectrical = Protor × ηdrive × ηgenerator × load fraction`

Rotor torque balance: `J × dω/dt = Taero − Tgenerator − Tloss`

Cp is a bounded assumed function of tip-speed ratio. The HAWT Cp peak is below the Betz limit (0.593); the custom VAWT uses a lower assumed peak. Fixed-yaw HAWT operation applies a cosine-based misalignment penalty. VAWT directional response varies modestly with wind direction rather than being treated as perfectly omnidirectional.

Turbulence is a deterministic multi-frequency gust approximation scaled by the selected intensity. Identical input and simulation time produce identical gust values.

## Dashboard definitions
- **Available wind power:** `0.5ρAv³`, before rotor conversion losses.
- **Aerodynamic power:** Available wind power multiplied by Cp.
- **Electrical output:** Rotor power multiplied by drivetrain efficiency, generator efficiency and load fraction.
- **Electrical efficiency:** Electrical output divided by available wind power.
- **Session energy:** Numerical integration of electrical output over simulation time; displayed in kWh.
- **Performance plots:** Calculated from torque-balance operating points from 0 to 25 m/s. They are model outputs, not measured turbine curves.
- **Noise:** Illustrative logarithmic combination of an assumed rotor-related source and ambient background. Not a certified acoustic prediction.

## Geometry and assumptions
The HAWT visual/reference dimensions are inspired by the 126 m rotor NREL 5-MW reference turbine. The VAWT uses an assumed 4.2 m radius and 18 m height for its projected two-panel swept area. VAWT dimensions and Cp are not measured.

## Scientific limitations
This is an educational reduced-order model, not validated CFD, a certified digital twin or an engineering design tool.
- The custom VAWT has no validated measured Cp curve. Its Cp and direction-response functions are assumptions.
- The HAWT is not a reproduction of the full NREL aero-servo-elastic model or its certified power curve.
- Detailed blade-element aerodynamics, dynamic stall, drivetrain compliance, structural loads and turbine controller dynamics are not modelled.
- Turbulence is a deterministic gust approximation, not a full atmospheric-boundary-layer model.
- Noise does not include validated source data, propagation, distance, terrain or directivity.
- Animated airflow particles are visual cues, not CFD streamlines.
- A fair comparison requires matched swept area, scale, operating constraints and validated turbine-specific data.

Do not use outputs for turbine sizing, safety, procurement or energy-yield guarantees.

## References
1. Jonkman et al. (2009), *Definition of a 5-MW Reference Wind Turbine for Offshore System Development*, NREL/TP-500-38060. https://www.nrel.gov/docs/fy09osti/38060.pdf
2. NREL Turbine Archive. https://natlabrockies.github.io/turbine-models/
3. Wind Toolkit Data Downloads. https://developer.nlr.gov/docs/wind/wind-toolkit/
4. Berg (1988), *Aerodynamic Design and Initial Performance Measurements for the SANDIA 34-Metre Diameter VAWT*, SAND1989-2597C. https://www.sandia.gov/research/publications/details/aerodynamic-design-and-initial-performance-measurements-for-the-sandia-34-m-1990-01-01/
5. U.S. Department of Energy, *Wind Turbine Sound*. https://www.energy.gov/cmei/systems/windexchange/sound
