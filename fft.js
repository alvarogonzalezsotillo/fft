//https://stackoverflow.com/questions/44343806/discrete-fourier-transforms-in-javascript
//import ComplexNumber from '../complex-number/ComplexNumber';

class ComplexNumber {
  /**
   * z = re + im * i
   * z = radius * e^(i * phase)
   *
   * @param {number} [re]
   * @param {number} [im]
   */
  constructor({ re = 0, im = 0 } = {}) {
    this.re = re;
    this.im = im;
  }

  /**
   * @param {ComplexNumber|number} addend
   * @return {ComplexNumber}
   */
  add(addend) {
    // Make sure we're dealing with complex number.
    const complexAddend = this.toComplexNumber(addend);

    return new ComplexNumber({
      re: this.re + complexAddend.re,
      im: this.im + complexAddend.im,
    });
  }

  /**
   * @param {ComplexNumber|number} subtrahend
   * @return {ComplexNumber}
   */
  subtract(subtrahend) {
    // Make sure we're dealing with complex number.
    const complexSubtrahend = this.toComplexNumber(subtrahend);

    return new ComplexNumber({
      re: this.re - complexSubtrahend.re,
      im: this.im - complexSubtrahend.im,
    });
  }

  /**
   * @param {ComplexNumber|number} multiplicand
   * @return {ComplexNumber}
   */
  multiply(multiplicand) {
    // Make sure we're dealing with complex number.
    const complexMultiplicand = this.toComplexNumber(multiplicand);

    return new ComplexNumber({
      re: this.re * complexMultiplicand.re - this.im * complexMultiplicand.im,
      im: this.re * complexMultiplicand.im + this.im * complexMultiplicand.re,
    });
  }

  /**
   * @param {ComplexNumber|number} divider
   * @return {ComplexNumber}
   */
  divide(divider) {
    // Make sure we're dealing with complex number.
    const complexDivider = this.toComplexNumber(divider);

    // Get divider conjugate.
    const dividerConjugate = this.conjugate(complexDivider);

    // Multiply dividend by divider's conjugate.
    const finalDivident = this.multiply(dividerConjugate);

    // Calculating final divider using formula (a + bi)(a − bi) = a^2 + b^2
    const finalDivider = (complexDivider.re ** 2) + (complexDivider.im ** 2);

    return new ComplexNumber({
      re: finalDivident.re / finalDivider,
      im: finalDivident.im / finalDivider,
    });
  }

  /**
   * @param {ComplexNumber|number} number
   */
  conjugate(number) {
    // Make sure we're dealing with complex number.
    const complexNumber = this.toComplexNumber(number);

    return new ComplexNumber({
      re: complexNumber.re,
      im: -1 * complexNumber.im,
    });
  }

  /**
   * @return {number}
   */
  getRadius() {
    return Math.sqrt((this.re ** 2) + (this.im ** 2));
  }

  /**
   * @param {boolean} [inRadians]
   * @return {number}
   */
  getPhase(inRadians = true) {
    let phase = Math.atan(Math.abs(this.im) / Math.abs(this.re));

    if (this.re < 0 && this.im > 0) {
      phase = Math.PI - phase;
    } else if (this.re < 0 && this.im < 0) {
      phase = -(Math.PI - phase);
    } else if (this.re > 0 && this.im < 0) {
      phase = -phase;
    } else if (this.re === 0 && this.im > 0) {
      phase = Math.PI / 2;
    } else if (this.re === 0 && this.im < 0) {
      phase = -Math.PI / 2;
    } else if (this.re < 0 && this.im === 0) {
      phase = Math.PI;
    } else if (this.re > 0 && this.im === 0) {
      phase = 0;
    } else if (this.re === 0 && this.im === 0) {
      // More correctly would be to set 'indeterminate'.
      // But just for simplicity reasons let's set zero.
      phase = 0;
    }

    if (!inRadians) {
      phase = radianToDegree(phase);
    }

    return phase;
  }

  /**
   * @param {boolean} [inRadians]
   * @return {{radius: number, phase: number}}
   */
  getPolarForm(inRadians = true) {
    return {
      radius: this.getRadius(),
      phase: this.getPhase(inRadians),
    };
  }

  /**
   * Convert real numbers to complex number.
   * In case if complex number is provided then lefts it as is.
   *
   * @param {ComplexNumber|number} number
   * @return {ComplexNumber}
   */
  toComplexNumber(number) {
    if (number instanceof ComplexNumber) {
      return number;
    }

    return new ComplexNumber({ re: number });
  }
}


const CLOSE_TO_ZERO_THRESHOLD = 1e-10;

/**
 * Discrete Fourier Transform (DFT): time to frequencies.
 *
 * Time complexity: O(N^2)
 *
 * @param {number[]} inputAmplitudes - Input signal amplitudes over time (complex
 * numbers with real parts only).
 * @param {number} zeroThreshold - Threshold that is used to convert real and imaginary numbers
 * to zero in case if they are smaller then this.
 *
 * @return {ComplexNumber[]} - Array of complex number. Each of the number represents the frequency
 * or signal. All signals together will form input signal over discrete time periods. Each signal's
 * complex number has radius (amplitude) and phase (angle) in polar form that describes the signal.
 *
 * @see https://gist.github.com/anonymous/129d477ddb1c8025c9ac
 * @see https://betterexplained.com/articles/an-interactive-guide-to-the-fourier-transform/
 */
function dft(inputAmplitudes, zeroThreshold = CLOSE_TO_ZERO_THRESHOLD) {
  const N = inputAmplitudes.length;
  const signals = [];

  // Go through every discrete frequency.
  for (let frequency = 0; frequency < N; frequency += 1) {
    // Compound signal at current frequency that will ultimately
    // take part in forming input amplitudes.
    let frequencySignal = new ComplexNumber();

    // Go through every discrete point in time.
    for (let timer = 0; timer < N; timer += 1) {
      const currentAmplitude = inputAmplitudes[timer];

      // Calculate rotation angle.
      const rotationAngle = -1 * (2 * Math.PI) * frequency * (timer / N);

      // Remember that e^ix = cos(x) + i * sin(x);
      const dataPointContribution = new ComplexNumber({
        re: Math.cos(rotationAngle),
        im: Math.sin(rotationAngle),
      }).multiply(currentAmplitude);

      // Add this data point's contribution.
      frequencySignal = frequencySignal.add(dataPointContribution);
    }

    // Close to zero? You're zero.
    if (Math.abs(frequencySignal.re) < zeroThreshold) {
      frequencySignal.re = 0;
    }

    if (Math.abs(frequencySignal.im) < zeroThreshold) {
      frequencySignal.im = 0;
    }

    // Average contribution at this frequency.
    // The 1/N factor is usually moved to the reverse transform (going from frequencies
    // back to time). This is allowed, though it would be nice to have 1/N in the forward
    // transform since it gives the actual sizes for the time spikes.
    frequencySignal = frequencySignal.divide(N);

    // Add current frequency signal to the list of compound signals.
    signals[frequency] = frequencySignal;
  }

  return signals;
}



// https://gist.github.com/mbitsnbites/a065127577ff89ff885dd0a932ec2477
// This is a tiny radix-2 FFT implementation in JavaScript.
// The function takes a complex valued input signal, and performs an in-place
// Fast Fourier Transform (i.e. the result is returned in x_re, x_im). The
// function arguments can be any Array type (including typed arrays).
// Code size: <300 bytes after Closure Compiler.
function FFT(x_re, x_im) {
  var m = x_re.length / 2, k, X_re = [], X_im = [], Y_re = [], Y_im = [],
      a, b, tw_re, tw_im;

  for (k = 0; k < m; ++k) {
    X_re[k] = x_re[2 * k];
    X_im[k] = x_im[2 * k];
    Y_re[k] = x_re[2 * k + 1];
    Y_im[k] = x_im[2 * k + 1];
  }

  if (m > 1) {
    FFT(X_re, X_im);
    FFT(Y_re, Y_im);
  }

  for (k = 0; k < m; ++k) {
    a = -Math.PI * k / m, tw_re = Math.cos(a), tw_im = Math.sin(a);
    a = tw_re * Y_re[k] - tw_im * Y_im[k];
    b = tw_re * Y_im[k] + tw_im * Y_re[k];
    x_re[k] = X_re[k] + a;
    x_im[k] = X_im[k] + b;
    x_re[k + m] = X_re[k] - a;
    x_im[k + m] = X_im[k] - b;
  }
}

function arrayLog(array){
    for( let i of array ){
        console.log(i);
    }
}

function realFFT_1(array){
    let ret = dft(array,0);
    return [ret.map( (c) => c.re), ret.map( (c) => c.im )];
}

function realFFT_2(array){

    //console.log("INPUT");
    //arrayLog(real);

    
    let length = array.length;
    let img = [];
    let real = array.slice();
    for( let i = 0 ; i < length ; i += 1 ){
        img[i] = 0;
    }
    FFT(real,img);

    //console.log("OUTPUT REAL");
    //arrayLog(real);
    //console.log("OUTPUT IMG");
    //arrayLog(img);

    return [real,img];
    
}

var realFFT = realFFT_2;



