window.addEventListener("load", loaded);

const steps = 1024;
const millis = 60;
let canvas = null;
let context = null;
let opciones = null;

function loaded(){
    console.log("loaded");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    opciones = new Opciones(document.getElementById("opciones"));
    
    window.addEventListener('resize', fitCanvas);
    window.setTimeout( fillCanvas, millis ); 
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

let offset = 1;

function pulso(ini,fin=ini+1,amplitud=1,step=32){
    return function(x){
        return x >= ini*step && x < fin*step ? amplitud : 0;
    };
}


const samples = [
    ["Varios pulsos cuadrados", (i)=>pulso(2)(i) + pulso(4)(i) + pulso(7)(i) + pulso(3,8,-2)(i) + pulso(-1,1,-2)(i) + pulso(-8)(i) + pulso(0,3,-2)(i) ],
    ["Un pulso cuadrado", (i) => pulso(3)(i) ],
    ["Sinusoidal", (i) => Math.sin(i*Math.PI/(steps/10))]
];


function fillCanvas(){
    let o = opciones.opciones;
    window.setTimeout( fillCanvas, o.millis ); 

    let array = [];
    offset += 1;
    offset %= steps;
    const sample = samples[o.sample][1];
    for( let _i = 0 ; _i < steps ; _i += 1 ){
        let i = (_i-offset+steps) % steps;
        array[_i] = sample(i);
    }

    clearCanvas();

    drawArray('original',array,0,100,canvas.width,20);

    let [real,img] = realFFT(array);

    drawArray('real',real,0,200,canvas.width,1,steps/2);

    drawArray('img',img,0,300,canvas.width,1,steps/2);

    let min = o.minFreq;
    let max = o.maxFreq;

    [real,img] = shiftFFT(real,img,o.offsetFreq);
    
    let reconstruida = recoverFFT(real,img,min,max);
    drawArray(`reconstruida(${min}-${max})`,reconstruida,0,400,canvas.width,20);
}

function shiftFFT(real,img,shift){
    let _img = new Array(real.length);
    let _real = new Array(real.length);
    for( let x = 0; x < real.length ; x+=1 ){
        _img[x] = _real[x] = 0;
    }
    
    for( let x = 0; x < real.length ; x+=1 ){
        let _x = (x + shift + real.length)%real.length;
        _real[_x] = real[x];
        _img[_x] = img[x];
    }
    return [_real,_img];
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
            let _x = steps-x;
            let angle = _x*f/(steps/(2*Math.PI)) + phase;
            ret[x] += m*Math.sin(angle);
        }
    }

    for( let x = 0 ; x < steps ; x+= 1 ){
        ret[x] /= steps/2;
    }
    
    return ret;
}


function drawArray(label,array,x0,y0,width,zoomy=1,steps){
    steps = steps || array.length;
    let step = width/steps;
    let xs = [];
    let ys = [];
    for( let i = 0 ; i < steps ; i += 1 ){
        xs[i] = x0 + i*step;
        ys[i] = y0 + array[i]*zoomy;
    }
    context.fillStyle = '#000000';
    context.fillText(label,x0,y0-20);
    linesTo(xs,ys);
}


class Opciones{


    constructor(element){
        this._element = element;
        this._minFreq = 0;
        this._maxFreq = steps/2;
        this._millis = 60;
        this._offsetFreq = 0;
        this._sample = 0;

        const frame = this.create("div",{
            style : {
                background: "rgba(255,255,255,0.5)",
                padding: "1em"
            }
        });

        const minimizable = this.create( "div",{
            className:"minimizable",
            style : {
                transition: "max-width 0.5s ease-in-out, max-height 0.5s ease-in-out",
            }
        });
        
        const grid = this.create( "div", {
            style : {
                display: "grid",
                gridTemplateColumns: "auto auto",
                alignItems: "center",
            }
            
        });

        const boton = this.create( "input",{
            type: "button",
            value : "≋",
            onclick : ()=> {
                minimizable.classList.toggle("minimizado");
            }
        });

        element.appendChild(frame);
        frame.appendChild(boton);
        frame.appendChild(minimizable);
        minimizable.appendChild(grid);

        this.creaCombo(grid,"Funcion",samples, 0,(v)=> this._sample = parseInt(v) );
        
        this.creaRango(grid,"Refresco (ms)", 1, 20, 10000, this._millis, (v)=> this._millis = parseInt(v) );
        this.creaRango(grid,"Desplazamiento frecuencia", 1, -20, 20, this._offsetFreq, (v)=> this._offsetFreq = parseInt(v) );
        this.creaRango(grid,"Frecuencia mínima", 1, 0, steps/2, this._minFreq, (v)=> {
            this._minFreq = parseInt(v);
            if( this._minFreq > this._maxFreq ){
                this._minFreq = this._maxFreq-1;
            }
            return this._minFreq;
        });
        this.creaRango(grid,"Frecuencia máxima", 1, 0, steps/2, this._maxFreq, (v)=> {
            this._maxFreq = parseInt(v);
            if( this._minFreq > this._maxFreq ){
                this._maxFreq = this._minFreq+1;
            }
            return this._maxFreq;
        });
    }

    create(tag, attrs){
        function applyStyle(elem,style){
            if( typeof style != "string" ){
                for( var s in style ){
                    elem.style[s] = style[s];
                }
            }
            else{
                elem.style = style;
            }
        }

        
        const ret = document.createElement(tag);
        for( var attr in attrs ){
            if( attr == "style" ){
                applyStyle(ret,attrs["style"]);
            }
            else{
                ret[attr] = attrs[attr];
            }
        }
        return ret;
    }

    creaCombo(grid,nombre,array,valor,callback){
        const row = 1+grid.childElementCount/2;
        
        const entrada = this.create("select",{
            className: "opcion-numero",
            onchange : ()=> callback(entrada.value),
            style: {
                gridColumn: 2,
                gridRow: row
            }
        });

        for( let i = 0 ; i < array.length ; i += 1 ){
            const option = this.create("option",{
                value: i,
                innerHTML: array[i][0]
            })
            entrada.appendChild(option);
        }
        
        const etiqueta = this.create("label", {
            innerHTML : nombre,
            htmlFor : entrada,
            className: "opcion-etiqueta",
            style: {
                gridColumn: 1,
                gridRow: row
            }
        });

        [etiqueta,entrada].forEach( (e)=> grid.appendChild(e) );
        
        return entrada;
        
    }
    
    creaRango(grid, nombre,paso,minimo,maximo,valor,callback){

        const row = 1+grid.childElementCount/2;
        
        const entrada = this.create("input",{
            type: "number",
            min: minimo,
            max: maximo,
            value: valor,
            step: paso,
            className: "opcion-numero",
            onchange : ()=> entrada.value = callback(entrada.value),
            style: {
                gridColumn: 2,
                gridRow: row
            }
        });
        const etiqueta = this.create("label", {
            innerHTML : nombre,
            htmlFor : entrada,
            className: "opcion-etiqueta",
            style: {
                gridColumn: 1,
                gridRow: row
            }
        });

        [etiqueta,entrada].forEach( (e)=> grid.appendChild(e) );
        
        return entrada;
    }

    get opciones(){
        return{
            minFreq  : this._minFreq,
            maxFreq  : this._maxFreq,
            millis : this._millis,
            offsetFreq : this._offsetFreq,
            sample: this._sample
        };
    }
};


