/**
 * Raw string tag: backslashes are kept literally, so LaTeX can be written naturally.
 *   r`If $\frac{x}{2} = 3$, then ...`   -> the string contains \frac exactly.
 * Money must be written \$ (escaped) so it is not treated as a math delimiter.
 * Do not write "${" inside an r`` string (that is a JS interpolation).
 */
export const r = String.raw;
