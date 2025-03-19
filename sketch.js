// 常量定义
const CANVAS_SIZE = 800;
const TERRAIN_SIZE = 100;
const CELL_SIZE = CANVAS_SIZE / TERRAIN_SIZE;

// 全局变量
let terrain = [];
let angle = 0;
let noiseScale = 0.05;
let heightScale = 20;
let rotationSpeed = 0.005;
let threshold = 128;
let cameraDistance = 400; // 添加相机距离

function setup() {
    createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    generateTerrain();
    
    // 设置控件事件
    document.getElementById('noiseScale').addEventListener('input', (e) => {
        noiseScale = parseFloat(e.target.value);
        generateTerrain();
    });
    
    document.getElementById('heightScale').addEventListener('input', (e) => {
        heightScale = parseInt(e.target.value);
        generateTerrain();
    });
    
    document.getElementById('rotationSpeed').addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target.value);
    });
    
    document.getElementById('threshold').addEventListener('input', (e) => {
        threshold = parseInt(e.target.value);
    });
}

function generateTerrain() {
    terrain = [];
    for (let x = 0; x < TERRAIN_SIZE; x++) {
        terrain[x] = [];
        for (let z = 0; z < TERRAIN_SIZE; z++) {
            // 使用多层噪声创造更自然的地形
            let value = 0;
            value += noise(x * noiseScale, z * noiseScale) * 0.5;
            value += noise(x * noiseScale * 2, z * noiseScale * 2) * 0.25;
            value += noise(x * noiseScale * 4, z * noiseScale * 4) * 0.125;
            terrain[x][z] = map(value, 0, 0.875, 0, heightScale);
        }
    }
}

function draw() {
    background(0);
    
    // 旋转视角
    angle += rotationSpeed;
    
    // 绘制地形
    for (let z = 0; z < TERRAIN_SIZE - 1; z++) {
        beginShape(TRIANGLE_STRIP);
        for (let x = 0; x < TERRAIN_SIZE; x++) {
            // 计算3D坐标
            let x1 = x * CELL_SIZE;
            let z1 = z * CELL_SIZE;
            let x2 = x * CELL_SIZE;
            let z2 = (z + 1) * CELL_SIZE;
            
            // 应用旋转和透视
            let rotatedX1 = x1 * cos(angle) - z1 * sin(angle);
            let rotatedZ1 = x1 * sin(angle) + z1 * cos(angle);
            let rotatedX2 = x2 * cos(angle) - z2 * sin(angle);
            let rotatedZ2 = x2 * sin(angle) + z2 * cos(angle);
            
            // 应用透视投影
            let scale1 = cameraDistance / (cameraDistance + rotatedZ1);
            let scale2 = cameraDistance / (cameraDistance + rotatedZ2);
            
            let projectedX1 = rotatedX1 * scale1;
            let projectedY1 = terrain[x][z] * scale1;
            let projectedX2 = rotatedX2 * scale2;
            let projectedY2 = terrain[x][z + 1] * scale2;
            
            // 计算光照
            let brightness1 = calculateBrightness(terrain[x][z], rotatedX1, rotatedZ1);
            let brightness2 = calculateBrightness(terrain[x][z + 1], rotatedX2, rotatedZ2);
            
            // 应用1-bit效果
            let color1 = brightness1 > threshold ? 255 : 0;
            let color2 = brightness2 > threshold ? 255 : 0;
            
            // 绘制三角形带
            fill(color1);
            vertex(projectedX1 + width/2, projectedY1 + height/2);
            fill(color2);
            vertex(projectedX2 + width/2, projectedY2 + height/2);
        }
        endShape();
    }
}

function calculateBrightness(height, x, z) {
    // 计算法线
    let normal = createVector(0, 1, 0);
    
    // 计算光照方向（从右上方照射）
    let light = createVector(1, 0.5, 1).normalize();
    
    // 计算漫反射
    let brightness = normal.dot(light);
    
    // 添加高度影响
    brightness += map(height, 0, heightScale, 0, 0.3);
    
    // 添加距离衰减
    let distance = sqrt(x * x + z * z);
    brightness *= map(distance, 0, CANVAS_SIZE/2, 1, 0.5);
    
    // 映射到0-255范围
    return map(brightness, -1, 1, 0, 255);
}

// 添加鼠标交互
function mouseDragged() {
    angle += (mouseX - pmouseX) * 0.01;
}

// 添加鼠标滚轮缩放
function mouseWheel(event) {
    cameraDistance += event.delta;
    cameraDistance = constrain(cameraDistance, 100, 800);
} 