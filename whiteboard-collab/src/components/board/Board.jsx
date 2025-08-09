import React from "react";
import { useRef, useState, useEffect } from "react";
import io from 'socket.io-client';
import { FaSquare, FaCircle, FaSlash, FaEraser, FaDownload, FaPencilAlt } from "react-icons/fa";
import './style.css'


class Board extends React.Component
{   
    timeout;
    socket = io.connect("http://localhost:3000");

    ctx;
    isDrawing = false;

    state = {
        tool : "pencil"
    };

    setTool = (toolName) => {
        this.setState({ tool: toolName });
    };



    constructor(props){
        super(props);

        

        this.socket.on("canvas-data", function(data) {
            var root = this;
            var interval = setInterval(function(){
                if(root.isDrawing) return;
                root.isDrawing = true;
                clearInterval(interval);
                var image = new Image();
                var canvas = document.querySelector('#board');
                var ctx = canvas.getContext('2d');
                image.onload = function(){
                    ctx.drawImage(image, 0, 0);

                    root.isDrawing = false;
                };
                image.src = data;
            }, 200)
            


        })
    }


    componentDidMount() {
        this.drawOnCanvas();
    }


    componentDidUpdate(prevProps) {
        if (prevProps.color !== this.props.color || prevProps.size !== this.props.size) {
            this.ctx.strokeStyle = this.props.color;
            this.ctx.lineWidth = this.props.size;
        }
    }    

    drawOnCanvas() {
        var canvas = document.querySelector('#board');
        this.ctx = canvas.getContext('2d');
        var ctx = this.ctx;
    
        var sketch = document.querySelector('#sketch');
        var sketch_style = getComputedStyle(sketch);
        canvas.width = parseInt(sketch_style.getPropertyValue('width'));
        canvas.height = parseInt(sketch_style.getPropertyValue('height'));
    
        let startX, startY, mouseX, mouseY;
        let drawing = false;
        const root = this;
    
        canvas.addEventListener('mousedown', function(e) {
            drawing = true;
            startX = e.offsetX;
            startY = e.offsetY;
    
            if (root.state.tool === "pencil" || root.state.tool === "eraser") {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
    
                // Set correct composite mode at start
                if (root.state.tool === "eraser") {
                    ctx.globalCompositeOperation = 'destination-out'; // Erase mode
                    ctx.lineWidth = 30; // Eraser size
                } else {
                    ctx.globalCompositeOperation = 'source-over'; // Normal draw
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = root.state.color;
                }
            }
        });
    
        canvas.addEventListener('mousemove', function(e) {
            if (!drawing) return;
    
            mouseX = e.offsetX;
            mouseY = e.offsetY;
    
            if (root.state.tool === "pencil") {
                ctx.lineTo(mouseX, mouseY);
                ctx.stroke();
            } 
            else if (root.state.tool === "eraser") {
                ctx.lineTo(mouseX, mouseY);
                ctx.stroke();
            }
        });
    
        canvas.addEventListener('mouseup', function(e) {
            drawing = false;
            ctx.globalCompositeOperation = 'source-over'; // Reset after erasing
    
            const endX = e.offsetX;
            const endY = e.offsetY;
    
            if (root.state.tool === "line") {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            } 
            else if (root.state.tool === "rectangle") {
                ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            } 
            else if (root.state.tool === "circle") {
                const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
    
            // Send to server
            if (root.timeout != undefined) clearTimeout(root.timeout);
            root.timeout = setTimeout(function() {
                var base64ImageData = canvas.toDataURL("image/png");
                root.socket.emit("canvas-data", base64ImageData);
            }, 1000);
        });
    }
    


    downloadImage = () => {
        const canvas = document.querySelector('#board');
        const image = canvas.toDataURL('image/jpg');
        
        const link = document.createElement('a');
        link.href = image;
        link.download = 'canvas-image.jpg';
        link.click();
    };
    


    render(){
        return (
            <div className="sketch" id="sketch">
                <div className="toolbar">
                    <button onClick={() => this.setTool("pencil")}><FaPencilAlt /></button>
                    <button onClick={() => this.setTool("rectangle")}><FaSquare /></button>
                    <button onClick={() => this.setTool("circle")}><FaCircle /></button>
                    <button onClick={() => this.setTool("line")}><FaSlash /></button>
                    <button onClick={() => this.setTool("eraser")}><FaEraser /></button>

                </div>

                <canvas className="board" id="board"></canvas>
               
                <button 
                    onClick={this.downloadImage} 
                    className="download-btn"
                    title="Download Image"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" height="24" 
                        fill="white" 
                        viewBox="0 0 16 16"
                    >
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v3.1A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5V10.4a.5.5 0 0 1 1 0v3.1A2.5 2.5 0 0 1 13.5 16h-11A2.5 2.5 0 0 1 0 13.5V10.4a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3.5-3.5a.5.5 0 1 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L4.854 7.646a.5.5 0 1 0-.708.708l3.5 3.5z"/>
                    </svg>
                </button>


            </div>
        )
    }
}


export default Board