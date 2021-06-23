window.addEventListener("load", loaded);

let canvas = null;
let context = null;

function loaded(){
    console.log("loaded");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    window.addEventListener('resize', fitCanvas);
    window.setInterval( fillCanvas, 20 ); 
    fitCanvas();
}

function fitCanvas(){
    if( !canvas || !context ){
        return;
    }
    canvas.width = window.innerWidth-20;
    canvas.height = window.innerHeight-20;
    fillCanvas();
}

function clearCanvas(){
    context.beginPath();
    context.rect(0,0,canvas.width,canvas.height);
    context.fillStyle = "yellow";
    context.fill();
}

function lineTo(x0,y0,x1,y1){
    linesTo([x0,x1],[y0,y1]);
}

function linesTo(xs,ys){
    //console.log("linesTo");
    //console.log(ys);
    context.beginPath();
    context.srokeStyle = "#0f0f0f";
    context.moveTo(xs[0],ys[0]);
    for( let i = 1 ; i < xs.length ; i += 1 ){
        context.lineTo(xs[i],ys[i]);
    }
    context.stroke();
}


function deg2rad(d){
    return d*Math.PI/180;
}

let center = 1;

function fillCanvas(){
    let array = [];
    center += 7;
    let steps = 1024;
    center %= steps;
    for( let i = 0 ; i < steps ; i += 1 ){
        array[i] = (i < center && i > center-40) ? 2 : 0;
        array[i] += (i < center + 40 && i > center-20) ? -2 : 0;
        array[i] += (i < center + 140 && i > center-120) ? -1 : 0;
    //      array[i] = 2*Math.sin( i*2*Math.PI/steps )
        //                 + Math.sin( i*4*Math.PI/steps );
    }

    clearCanvas();

    drawArray('original',array,0,100,canvas.width,20);

    let [real,img] = realFFT(array.slice());

    drawArray('real',real,0,200,canvas.width,1);

    drawArray('img',img,0,300,canvas.width,1);

    for( let fidelidad = 30 ; fidelidad <= 150 ; fidelidad += 30 ){
        let reconstruida = recoverFFT(real,img,0,fidelidad);
        drawArray(`reconstruida(${fidelidad})`,reconstruida,0,300+(fidelidad*100/30),canvas.width,0.05);
    }
    
    console.log(img);

}


function recoverFFT(real,img,min,max){
    min = min || 0;
    max = max || real.length;
    let steps = real.length;
    let ret = new Array(steps);
    for( let x = 0 ; x < steps; x += 1 ){
        ret[x] = 0;
    }

    for(let f = min ; f < max ; f += 1 ){
        let m = Math.sqrt( img[f]**2 + real[f]**2 );
        let phase = Math.atan2(real[f],img[f]);

        for( let x = 0 ; x < steps; x += 1 ){
            let angle = x*f/(steps/(2*Math.PI)) + phase;
            ret[x] += m*Math.sin(angle);
        }
    }
    
    return ret;
}


function drawArray(label,array,x0,y0,width,zoomy=1){
    let step = width/array.length;
    let xs = [];
    let ys = [];
    for( let i = 0 ; i < array.length ; i += 1 ){
        xs[i] = x0 + i*step;
        ys[i] = y0 + array[i]*zoomy;
    }
    context.fillStyle = '#000000';
    context.fillText(label,x0,y0-20);
    linesTo(xs,ys);
}
