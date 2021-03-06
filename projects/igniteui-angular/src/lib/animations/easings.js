"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EaseIn;
(function (EaseIn) {
    EaseIn[EaseIn["quad"] = "cubic-bezier(0.550, 0.085, 0.680, 0.530)"] = "quad";
    EaseIn[EaseIn["cubic"] = "cubic-bezier(0.550, 0.055, 0.675, 0.190)"] = "cubic";
    EaseIn[EaseIn["quart"] = "cubic-bezier(0.895, 0.030, 0.685, 0.220)"] = "quart";
    EaseIn[EaseIn["quint"] = "cubic-bezier(0.755, 0.050, 0.855, 0.060)"] = "quint";
    EaseIn[EaseIn["sine"] = "cubic-bezier(0.470, 0.000, 0.745, 0.715)"] = "sine";
    EaseIn[EaseIn["expo"] = "cubic-bezier(0.950, 0.050, 0.795, 0.035)"] = "expo";
    EaseIn[EaseIn["circ"] = "cubic-bezier(0.600, 0.040, 0.980, 0.335)"] = "circ";
    EaseIn[EaseIn["back"] = "cubic-bezier(0.600, -0.280, 0.735, 0.045)"] = "back";
})(EaseIn || (EaseIn = {}));
exports.EaseIn = EaseIn;
var EaseOut;
(function (EaseOut) {
    EaseOut[EaseOut["quad"] = "cubic-bezier(0.250, 0.460, 0.450, 0.940)"] = "quad";
    EaseOut[EaseOut["cubic"] = "cubic-bezier(0.215, 0.610, 0.355, 1.000)"] = "cubic";
    EaseOut[EaseOut["quart"] = "cubic-bezier(0.165, 0.840, 0.440, 1.000)"] = "quart";
    EaseOut[EaseOut["quint"] = "cubic-bezier(0.230, 1.000, 0.320, 1.000)"] = "quint";
    EaseOut[EaseOut["sine"] = "cubic-bezier(0.390, 0.575, 0.565, 1.000)"] = "sine";
    EaseOut[EaseOut["expo"] = "cubic-bezier(0.190, 1.000, 0.220, 1.000)"] = "expo";
    EaseOut[EaseOut["circ"] = "cubic-bezier(0.075, 0.820, 0.165, 1.000)"] = "circ";
    EaseOut[EaseOut["back"] = "cubic-bezier(0.175, 0.885, 0.320, 1.275)"] = "back";
})(EaseOut || (EaseOut = {}));
exports.EaseOut = EaseOut;
var EaseInOut;
(function (EaseInOut) {
    EaseInOut[EaseInOut["quad"] = "cubic-bezier(0.455, 0.030, 0.515, 0.955)"] = "quad";
    EaseInOut[EaseInOut["cubic"] = "cubic-bezier(0.645, 0.045, 0.355, 1.000)"] = "cubic";
    EaseInOut[EaseInOut["quart"] = "cubic-bezier(0.770, 0.000, 0.175, 1.000)"] = "quart";
    EaseInOut[EaseInOut["quint"] = "cubic-bezier(0.860, 0.000, 0.070, 1.000)"] = "quint";
    EaseInOut[EaseInOut["sine"] = "cubic-bezier(0.445, 0.050, 0.550, 0.950)"] = "sine";
    EaseInOut[EaseInOut["expo"] = "cubic-bezier(1.000, 0.000, 0.000, 1.000)"] = "expo";
    EaseInOut[EaseInOut["circ"] = "cubic-bezier(0.785, 0.135, 0.150, 0.860)"] = "circ";
    EaseInOut[EaseInOut["back"] = "cubic-bezier(0.680, -0.550, 0.265, 1.550)"] = "back";
})(EaseInOut || (EaseInOut = {}));
exports.EaseInOut = EaseInOut;

//# sourceMappingURL=easings.js.map
