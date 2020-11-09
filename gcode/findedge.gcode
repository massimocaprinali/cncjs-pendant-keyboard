G38.2 Z-15 F100; Probe Z
G92 Z{{plateThickness}}; Set zero Z (5mm calibration plate thickness)
G91
G0 Z3; Lift 3mm (z)
G0 X-{{margin}}; Move 60mm to left (x)
G0 Z-6; Move 6mm down (z)
G38.2 X50 F100; Probe X
G92 X{{offset}}; Set zero X (-10.10mm calibration plate thickness -1/2 tool thickness)
G91
G0 X-3; Move 3mm left (x)
G0 Z6; Lift 6mm (z)
G0 Y-{{margin}}; Move 60mm to front (y)
G0 X{{margin}}; Move 60mm to right (x)
G0 Z-6; Move 6mm down (z)
G38.2 Y50 F100; Prove Y
G92 Y{{offset}}; Set zero Y (-10.10mm calibration plate thickness -1/2 tool thickness)
G91
G0 Y-3; Move 3mm to front (y)
G0 Z20; Lift 20mm up (z)
G92
F1500