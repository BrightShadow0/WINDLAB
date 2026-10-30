# WINDLAB
### Interactive 3D Wind-Turbine Simulation and Comparative Analysis

WINDLAB is an educational, hypothesis-driven simulator comparing a conventional three-bladed horizontal-axis wind turbine (HAWT), a whale-tubercle-inspired three-bladed HAWT, and a custom two-panel twisted vertical-axis wind turbine (VAWT). Its central research question is whether bio-inspired blade geometries could reduce operational noise while retaining useful energy-generation performance. It combines an interactive Three.js scene, adjustable wind conditions, reduced-order rotor dynamics, live telemetry and dynamically generated performance plots. The acoustic differences are theoretical model assumptions for exploration, not experimentally validated claims.

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
- Interactive conventional three-blade HAWT, whale-tubercle-inspired three-blade HAWT, and two opposing twisted VAWT panels with orbit, zoom and camera views.
- Wind speed (0–25 m/s), direction, turbulence intensity, air density and generator-load controls.
- Both HAWT variants support automatic yaw alignment and fixed-heading modes.
- Rotor angular dynamics driven by aerodynamic torque, generator-load torque and mechanical losses.
- Tip-speed-ratio-dependent Cp, cut-in/cut-out protection and HAWT yaw-misalignment penalty.
- Live RPM, available wind power, aerodynamic power, electrical output, Cp, estimated noise and accumulated energy.
- Research-informed, illustrative acoustic estimates that allow the three concepts to be compared under the same selected operating conditions.
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
- **Noise:** Illustrative logarithmic combination of an assumed rotor-related source and ambient background. The model deliberately assigns the highest reference source level to the conventional HAWT (46 dB), then the bio-inspired HAWT (43 dB), then the bio-inspired VAWT (41.5 dB). These explicit design offsets encode the project's hypothesis and are not measured differences or validated correction factors. The bio-HAWT also receives a speed-dependent reduction of up to 1.5 dB at higher rotational regimes. They are not certified acoustic predictions.

## Geometry and assumptions
Both HAWT visual/reference dimensions use the 126 m rotor NREL 5-MW reference turbine scale. The whale-inspired HAWT adds illustrative leading-edge tubercles inspired by humpback whale flippers. Its aerodynamic power assumptions remain identical to the conventional HAWT so the current comparison isolates the acoustic hypothesis rather than claiming an energy-yield improvement. The VAWT uses an assumed 4.2 m radius and 18 m height for its projected two-panel swept area. VAWT dimensions and Cp are not measured.

## Scientific limitations
This is an educational reduced-order model, not validated CFD, a certified digital twin or an engineering design tool. The noise-reduction hypothesis is that even a small reduction in operational sound could improve acoustic comfort for residents living near wind-energy installations. The simulator explores that possibility; it does not establish a real-world community-noise benefit.
- The custom VAWT has no validated measured Cp curve. Its Cp and direction-response functions are assumptions.
- The whale-inspired HAWT uses the same reduced-order power-performance assumptions as the conventional HAWT. Its tubercle geometry is illustrative; no aerodynamic or energy-yield benefit is assumed or proven by this simulator.
- The acoustic model intentionally encodes the expected ordering, conventional HAWT louder than bio-HAWT and bio-VAWT, through explicit reference-level offsets. This is the project's hypothesis, not an empirical conclusion. Published field comparisons provide context but do not establish a universal ranking across turbine types.
- The bio-HAWT acoustic adjustment is capped at an illustrative 1.5 dB and becomes active mainly at higher rotational regimes. Research on serrated wind-turbine blades supports the possibility of noise reductions in some conditions, but the tested geometries are not identical to this whale-tubercle design.
- The tubercle-inspired marine propeller research cited below concerns underwater radiated noise. Its reported reductions must not be transferred directly to airborne wind turbines.
- The HAWT is not a reproduction of the full NREL aero-servo-elastic model or its certified power curve.
- Detailed blade-element aerodynamics, dynamic stall, drivetrain compliance, structural loads and turbine controller dynamics are not modelled.
- Turbulence is a deterministic gust approximation, not a full atmospheric-boundary-layer model.
- Noise does not include validated source data, propagation, distance, terrain, directivity or environmental ambient noise.
- Animated airflow particles are visual cues, not CFD streamlines.
- A fair comparison requires matched swept area, scale, operating constraints and validated turbine-specific data.

Do not use outputs for turbine sizing, safety, procurement or energy-yield guarantees.

## References
1. Jonkman et al. (2009), *Definition of a 5-MW Reference Wind Turbine for Offshore System Development*, NREL/TP-500-38060. https://www.nrel.gov/docs/fy09osti/38060.pdf
2. NREL Turbine Archive. https://natlabrockies.github.io/turbine-models/
3. Wind Toolkit Data Downloads. https://developer.nlr.gov/docs/wind/wind-toolkit/
4. Berg (1988), *Aerodynamic Design and Initial Performance Measurements for the SANDIA 34-Metre Diameter VAWT*, SAND1989-2597C. https://www.sandia.gov/research/publications/details/aerodynamic-design-and-initial-performance-measurements-for-the-sandia-34-m-1990-01-01/
5. U.S. Department of Energy, *Wind Turbine Sound*. https://www.energy.gov/cmei/systems/windexchange/sound
6. Schmidt & Redonnet (2026), experimental aeroacoustics of bio-inspired serrated wind-turbine blades. https://link.springer.com/article/10.1186/s42774-025-00251-2
7. Cao et al. (2022), research on trailing-edge serrations for wind-turbine airfoils. https://pubmed.ncbi.nlm.nih.gov/35232091/
8. *Energies* (2016), 9(1), 19, field noise measurements of a 200 kW vertical-axis wind turbine. https://www.mdpi.com/1996-1073/9/1/19
9. Humpback-whale-inspired tubercles on marine propellers (2021), CFD study of underwater radiated noise. https://pmc.ncbi.nlm.nih.gov/articles/PMC8424344/
