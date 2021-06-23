window.addEventListener("load", loaded);

let canvas = null;
let context = null;

function loaded(){
    console.log("loaded");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    window.addEventListener('resize', fitCanvas);
    window.setInterval( fillCanvas, 20000 ); 
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
    center += 1;
    let steps = 1024;
    center %= steps;
    for( let i = 0 ; i < steps ; i += 1 ){
        array[i] = (i < center ) ? 1 : 0;
        array[i] = 2*Math.sin( i*2*Math.PI/steps )
                   //+ Math.sin( i/1000 );
    }

    clearCanvas();

    drawArray(array,0,150,canvas.width,20);

    [real,img] = realFFT(array.slice());

    drawArray(real,0,300,canvas.width,10);

    drawArray(img,0,450,canvas.width,10);

    let reconstruida = recoverFFT(real,img,0,real.length/2);

    drawArray(reconstruida,0,600,canvas.width,10);
    
    console.log(img);

}


function recoverFFT(real,img,min,max){
    min = min || 0;
    max = max || real.length;
    let length = real.length;
    let ret = new Array(length);
    for( let x = 0 ; x < length ; x += 1 ){
        ret[x] = 0;
    }

    for(let f = min ; f < max ; f += 1 ){
        let m = Math.sqrt( img[f]**2 + real[f]**2 );
        let phase = 0;

        for( let x = 0 ; x < ret.length ; x += 1 ){
            let angle = x*f/re + phase;
            ret[x] += m*Math.sin(angle);
        }
    }
    
    return ret;
}


function drawArray(array,x0,y0,width,zoomy=1){
    let step = width/array.length;
    let xs = [];
    let ys = [];
    for( let i = 0 ; i < array.length ; i += 1 ){
        xs[i] = x0 + i*step;
        ys[i] = y0 + array[i]*zoomy;
    }

    linesTo(xs,ys);
}




