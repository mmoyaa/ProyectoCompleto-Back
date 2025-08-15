// Test directo en el navegador
// Abre la consola del navegador y ejecuta este código

console.log('🧪 INICIANDO TEST DE RADIO BUTTONS...');

// 1. Probar si podemos detectar radio buttons seleccionados
function testRadioDetection() {
    console.log('\n📝 === TEST 1: DETECCIÓN DE RADIO BUTTONS ===');
    
    // Buscar todos los radio buttons
    const allRadios = document.querySelectorAll('input[type="radio"]');
    console.log(`📊 Total radio buttons encontrados: ${allRadios.length}`);
    
    // Buscar radio buttons seleccionados
    const checkedRadios = document.querySelectorAll('input[type="radio"]:checked');
    console.log(`✅ Radio buttons seleccionados: ${checkedRadios.length}`);
    
    if (checkedRadios.length > 0) {
        console.log('\n📋 Radio buttons seleccionados:');
        checkedRadios.forEach((radio, index) => {
            console.log(`${index + 1}. Name: "${radio.name}", Value: "${radio.value}", ID: "${radio.id}"`);
        });
    } else {
        console.log('⚠️ No hay radio buttons seleccionados');
    }
    
    // Buscar radio buttons con atributo name
    const radiosWithName = document.querySelectorAll('input[type="radio"][name]');
    console.log(`📝 Radio buttons con atributo "name": ${radiosWithName.length}`);
    
    if (radiosWithName.length > 0) {
        console.log('\n📋 Radio buttons con name (primeros 10):');
        Array.from(radiosWithName).slice(0, 10).forEach((radio, index) => {
            console.log(`${index + 1}. Name: "${radio.name}", ID: "${radio.id}"`);
        });
    }
    
    return {
        totalRadios: allRadios.length,
        checkedRadios: checkedRadios.length,
        radiosWithName: radiosWithName.length
    };
}

// 2. Seleccionar algunos radio buttons automáticamente para test
function selectTestRadios() {
    console.log('\n🔘 === TEST 2: SELECCIÓN AUTOMÁTICA ===');
    
    // Buscar radio buttons de las preguntas 47-50 (que tienen name)
    const testQuestions = ['pregunta47', 'pregunta48', 'pregunta49', 'pregunta50'];
    let selected = 0;
    
    testQuestions.forEach(questionName => {
        const radios = document.querySelectorAll(`input[name="${questionName}"]`);
        if (radios.length > 0) {
            // Seleccionar el primer radio button de cada pregunta
            radios[0].checked = true;
            selected++;
            console.log(`✅ Seleccionado: ${questionName} = ${radios[0].value}`);
        } else {
            console.log(`❌ No se encontraron radios para: ${questionName}`);
        }
    });
    
    console.log(`📊 Radio buttons seleccionados automáticamente: ${selected}`);
    return selected;
}

// 3. Simular la función hasAnswers() del componente
function testHasAnswers() {
    console.log('\n🔍 === TEST 3: FUNCIÓN hasAnswers() ===');
    
    const checkedInputs = document.querySelectorAll('input[type="radio"]:checked');
    const hasAnswers = checkedInputs.length > 0;
    
    console.log(`🔘 Radio buttons seleccionados: ${checkedInputs.length}`);
    console.log(`✅ hasAnswers() resultado: ${hasAnswers}`);
    
    return hasAnswers;
}

// 4. Simular la función collectResponses()
function testCollectResponses() {
    console.log('\n📝 === TEST 4: FUNCIÓN collectResponses() ===');
    
    const responses = [];
    const checkedInputs = document.querySelectorAll('input[type="radio"]:checked');
    
    console.log(`🔍 Radio buttons seleccionados encontrados: ${checkedInputs.length}`);
    
    checkedInputs.forEach((input, index) => {
        const questionElement = input.closest('.question-card, .question-item');
        const questionText = questionElement?.querySelector('.question-text, .question-label')?.textContent || `Pregunta ${index + 1}`;
        
        responses.push({
            id: index + 1,
            name: input.name,
            pregunta: questionText.trim(),
            respuesta: input.value,
            puntaje: getScoreFromValue(input.value)
        });
        
        console.log(`📝 Respuesta ${index + 1}: ${input.name} = ${input.value}`);
    });
    
    console.log(`📋 Total de respuestas recopiladas: ${responses.length}`);
    return responses;
}

// Función auxiliar para puntajes
function getScoreFromValue(value) {
    switch(value) {
        case 'nunca': return 1;
        case 'casi-nunca': return 2;
        case 'a-veces': return 3;
        case 'ocasionalmente': return 2;
        case 'frecuentemente': return 4;
        case 'siempre': return 5;
        default: return 3;
    }
}

// Ejecutar todos los tests
async function runAllTests() {
    console.log('🚀 === INICIANDO BATERÍA DE TESTS ===\n');
    
    // Test inicial
    const detection1 = testRadioDetection();
    
    // Seleccionar radio buttons automáticamente
    const selected = selectTestRadios();
    
    // Test después de selección
    console.log('\n🔄 === DESPUÉS DE SELECCIÓN AUTOMÁTICA ===');
    const detection2 = testRadioDetection();
    
    // Test de funciones
    const hasAnswers = testHasAnswers();
    const responses = testCollectResponses();
    
    // Resumen final
    console.log('\n📊 === RESUMEN FINAL ===');
    console.log(`🔘 Total radio buttons: ${detection1.totalRadios}`);
    console.log(`📝 Radio buttons con name: ${detection1.radiosWithName}`);
    console.log(`✅ Radio buttons seleccionados automáticamente: ${selected}`);
    console.log(`🔍 Radio buttons detectados como seleccionados: ${detection2.checkedRadios}`);
    console.log(`✅ hasAnswers() resultado: ${hasAnswers}`);
    console.log(`📋 Respuestas recopiladas: ${responses.length}`);
    
    if (hasAnswers && responses.length > 0) {
        console.log('🎉 ¡TEST EXITOSO! El frontend puede detectar respuestas.');
        return true;
    } else {
        console.log('❌ TEST FALLIDO: El frontend no puede detectar respuestas correctamente.');
        return false;
    }
}

// Ejecutar test
runAllTests();
