# Testing Guide - PoseCoach AI

## 🧪 Test Setup

Este proyecto utiliza:

- **Jest** - Framework de testing
- **React Testing Library** - Testing de componentes React
- **TypeScript** - Tipado estático

## 📁 Estructura de Tests

```
├── services/
│   └── __tests__/
│       └── PoseDetector.test.ts
├── utils/
│   └── __tests__/
│       ├── geometry.test.ts
│       └── canvasDrawing.test.ts
├── analysis/
│   └── strategies/
│       └── __tests__/
│           └── FrontDoubleBicep.test.ts
└── lib/
    └── __tests__/
        └── storage.test.ts
```

## 🚀 Comandos

```bash
# Ejecutar todos los tests
pnpm test

# Ejecutar tests en modo watch (desarrollo)
pnpm test:watch

# Generar reporte de cobertura
pnpm test:coverage
```

## 📊 Cobertura Actual

- **Services**: PoseDetectorService (Singleton, inicialización, estimación)
- **Utils**: Geometría (distancias, ángulos, visibilidad)
- **Utils**: Canvas (dibujo de keypoints y skeleton)
- **Analysis**: Estrategia Front Double Bicep
- **Lib**: Storage (localStorage para historial)

## 🎯 Test Patterns

### 1. **Unit Tests**

Tests aislados de funciones puras (utils/geometry, utils/canvasDrawing)

```typescript
describe("calculateDistance", () => {
  it("should calculate distance between two points", () => {
    const p1: Keypoint = { x: 0, y: 0, score: 1 };
    const p2: Keypoint = { x: 3, y: 4, score: 1 };

    expect(calculateDistance(p1, p2)).toBe(5);
  });
});
```

### 2. **Service Tests**

Tests del servicio Singleton con mocks de TensorFlow

```typescript
describe("PoseDetectorService", () => {
  it("should return the same instance", () => {
    const instance1 = PoseDetectorService.getInstance();
    const instance2 = PoseDetectorService.getInstance();

    expect(instance1).toBe(instance2);
  });
});
```

### 3. **Strategy Tests**

Tests de las estrategias de análisis de poses

```typescript
describe("analyzeFrontDoubleBicep", () => {
  it("should detect shoulder misalignment", () => {
    const keypoints = createMockKeypoints({
      left_shoulder: { x: 80, y: 100, score: 0.9 },
      right_shoulder: { x: 120, y: 140, score: 0.9 },
    });

    const result = analyzeFrontDoubleBicep(keypoints);
    expect(result.feedback.find((f) => f.status !== "success")).toBeDefined();
  });
});
```

## 🔧 Mocks Configurados

### TensorFlow.js

```javascript
jest.mock("@tensorflow/tfjs", () => ({
  ready: jest.fn(() => Promise.resolve()),
}));
```

### PoseNet

```javascript
jest.mock("@tensorflow-models/posenet", () => ({
  load: jest.fn(() =>
    Promise.resolve({
      estimateSinglePose: jest.fn(),
      dispose: jest.fn(),
    })
  ),
}));
```

### MediaDevices (Camera)

```javascript
Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: jest.fn(() =>
      Promise.resolve({
        getTracks: () => [{ stop: jest.fn() }],
      })
    ),
  },
});
```

### Canvas API

```javascript
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  // ... otros métodos
}));
```

## 📝 Agregar Nuevos Tests

### Para una función utility:

1. Crear archivo en `utils/__tests__/nombre.test.ts`
2. Importar la función
3. Describir casos de prueba

### Para una estrategia de análisis:

1. Crear archivo en `analysis/strategies/__tests__/NombreEstrategia.test.ts`
2. Usar `createMockKeypoints()` para generar datos de prueba
3. Verificar estructura de feedback y scores

### Para un componente:

1. Crear archivo en `components/__tests__/ComponentName.test.tsx`
2. Usar `@testing-library/react` para renderizar
3. Testear interacciones y renderizado

## 🎨 Best Practices

1. **Descriptive test names**: Usa `it('should do something specific')`
2. **Arrange-Act-Assert**: Organiza tus tests en 3 secciones claras
3. **Mock external dependencies**: No llames APIs reales o cargues modelos pesados
4. **Test edge cases**: No solo el happy path
5. **Keep tests independent**: Cada test debe poder correr aislado

## 🐛 Debugging Tests

```bash
# Ver logs detallados
pnpm test -- --verbose

# Ejecutar un archivo específico
pnpm test -- geometry.test.ts

# Ejecutar tests que coincidan con un patrón
pnpm test -- --testNamePattern="calculate"
```

## 📈 CI/CD Integration

Los tests se ejecutan automáticamente en:

- Pre-commit hooks
- Pull requests
- Builds de producción

## 🔄 Próximos Tests a Agregar

- [ ] Tests de componentes React (CameraView, AnalysisView)
- [ ] Tests de integración entre servicios
- [ ] Tests E2E con Playwright
- [ ] Tests de performance del modelo
- [ ] Tests de las otras estrategias (LatSpread, SideChest, BackDoubleBiceps)

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
