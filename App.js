import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';


function App() {
  const [questions, setQuestions] = useState([]); // Список вопросов
  const [currentQuestion, setCurrentQuestion] = useState(null); // Текущий вопрос
  const [score, setScore] = useState(0); // Счет игрока
  const [timeLeft, setTimeLeft] = useState(60); // Оставшееся время
  const [userGuess, setUserGuess] = useState(null); // Выбор сделанный пользователем
  const [gameStatus, setGameStatus] = useState('idle'); // Статус игры: idle, playing, finished
  const [feedback, setFeedback] = useState(null); // Связь после ответа

  // Вопросы
  const mockQuestions = [
    {
      question: "Где находится Эйфелева башня?",
      answer: { lat: 48.8584, lng: 2.2945 },
      hint: "Столица Франции"
    },
    {
      question: "Где находится Статуя Свободы?",
      answer: { lat: 40.6892, lng: -74.0445 },
      hint: "Самый большой город США"
    }
  ];

  // Загрузка вопросов при запуске приложения
  useEffect(() => {
    setQuestions(mockQuestions);
    setCurrentQuestion(mockQuestions[0]);
  }, []);

  // Таймер
  useEffect(() => {
    let timer;
    if (gameStatus === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setGameStatus('finished');
    }
    return () => clearTimeout(timer);
  }, [timeLeft, gameStatus]);

  // Обработчик клика по карте
  const handleMapClick = (latlng) => {
    if (gameStatus !== 'playing') return;
    
    setUserGuess(latlng);
    const accuracy = calculateAccuracy(latlng, currentQuestion.answer);
    const points = Math.round(accuracy * 100);
    setScore(score + points);
    
    // Визуальная обратная связь
    setFeedback({
      position: latlng,
      accuracy: accuracy
    });
    
    // Переход к следующему вопросу через 2 секунды
    setTimeout(nextQuestion, 2000);
  };

  
  const calculateAccuracy = (guess, answer) => {
    // Рассчитываем расстояние между точками
    const R = 6371; // Радиус Земли в км
    const dLat = (guess.lat - answer.lat) * Math.PI / 180;
    const dLng = (guess.lng - answer.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(answer.lat * Math.PI / 180) * Math.cos(guess.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c * 1000; // Расстояние в метрах
    
    // Максимальное расстояние для 0% точности - 500 км
    const maxDistance = 500000;
    const accuracy = Math.max(0, 1 - (distance / maxDistance));
    return accuracy;
  };

  // Переход к следующему вопросу
  const nextQuestion = () => {
    setFeedback(null);
    const currentIndex = questions.indexOf(currentQuestion);
    if (currentIndex < questions.length - 1) {
      setCurrentQuestion(questions[currentIndex + 1]);
      setTimeLeft(60);
    } else {
      setGameStatus('finished');
    }
  };

  // Начало игры
  const startGame = () => {
    setScore(0);
    setCurrentQuestion(questions[0]);
    setTimeLeft(60);
    setGameStatus('playing');
    setUserGuess(null);
  };

  // Компонент для обработки событий карты
  function MapClickHandler({ onClick }) {
    const map = useMapEvents({
      click(e) {
        onClick(e.latlng);
      }
    });
    return null;
  }

  // Определение цвета круга в зависимости от точности
  const getCircleColor = (accuracy) => {
    if (accuracy > 0.8) return 'green'; // 100-80% - зеленый
    if (accuracy > 0.5) return 'yellow'; // 80-50% - желтый
    return 'red'; // Ниже 50% - красный
  };

  return (
    <div className="app">
      <h1>Географическая Викторина</h1>
      
      {gameStatus === 'idle' && (
        <button onClick={startGame}>Начать игру</button>
      )}
      
      {gameStatus === 'playing' && currentQuestion && (
        <div className="game-container">
          <div className="question-panel">
            <h2>{currentQuestion.question}</h2>
            <p>Подсказка: {currentQuestion.hint}</p>
            <p>Время: {timeLeft} сек | Очки: {score}</p>
          </div>
          
          <div className="map-container">
            <MapContainer 
              center={[20, 0]} 
              zoom={2} 
              style={{ height: '500px', width: '800px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Обработчик кликов по карте */}
              <MapClickHandler onClick={handleMapClick} />
              
              {/* Правильный ответ */}
              {userGuess && (
                <Circle
                  center={[currentQuestion.answer.lat, currentQuestion.answer.lng]}
                  radius={500000} // 500 км радиус для визуализации
                  color="blue"
                  fillOpacity={0.1}
                />
              )}
              
              {/* Ответ пользователя и обратная связь */}
              {feedback && (
                <>
                  <Circle
                    center={[feedback.position.lat, feedback.position.lng]}
                    radius={10000} // 10 км радиус для визуализации
                    color={getCircleColor(feedback.accuracy)}
                    fillOpacity={0.5}
                  />
                </>
              )}
            </MapContainer>
          </div>
        </div>
      )}
      
      {gameStatus === 'finished' && (
        <div className="results">
          <h2>Игра окончена!</h2>
          <p>Ваш итоговый счет: {score} из {questions.length * 100}</p>
          <button onClick={startGame}>Играть снова</button>
        </div>
      )}
    </div>
  );
}

export default App;