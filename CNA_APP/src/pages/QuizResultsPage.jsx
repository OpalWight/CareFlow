import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import Layout from '../components/Layout';
import { getQuizResults, retakeQuiz } from '../api/quizApi';
import ResultsSummary from '../components/ResultsSummary';
import QuestionResultCard from '../components/QuestionResultCard';
import '../styles/QuizResults.css';

const QuizResultsPage = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [resultsData, setResultsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'correct', 'incorrect'
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    useEffect(() => {
        const loadQuizResults = async () => {
            try {
                setIsLoading(true);
                const data = await getQuizResults(quizId);
                setResultsData(data);
                setError(null);
            } catch (error) {
                console.error('Error loading quiz results:', error);
                setError('Failed to load quiz results. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        if (user && quizId) {
            loadQuizResults();
        }
    }, [user, quizId]);

    const handleRetakeQuiz = async () => {
        try {
            setIsLoading(true);
            await retakeQuiz(quizId);
            // Navigate to quiz page for retake
            navigate('/quiz', { state: { isRetake: true, originalQuizId: quizId } });
        } catch (error) {
            console.error('Error setting up quiz retake:', error);
            setError('Failed to set up quiz retake. Please try again.');
            setIsLoading(false);
        }
    };

    const getFilteredQuestions = () => {
        if (!resultsData?.questions) return [];
        
        switch (filter) {
            case 'correct':
                return resultsData.questions.filter(q => q.isCorrect);
            case 'incorrect':
                return resultsData.questions.filter(q => !q.isCorrect);
            default:
                return resultsData.questions;
        }
    };

    const filteredQuestions = getFilteredQuestions();

    const handleQuestionNavigation = (direction) => {
        const maxIndex = filteredQuestions.length - 1;
        if (direction === 'next' && currentQuestionIndex < maxIndex) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else if (direction === 'prev' && currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const jumpToQuestion = (index) => {
        setCurrentQuestionIndex(index);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="quiz-results-container">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading quiz results...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="quiz-results-container">
                    <div className="error-message">
                        <h2>Error Loading Results</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate('/quiz')} className="btn-primary">
                            Back to Quiz
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!resultsData) {
        return (
            <Layout>
                <div className="quiz-results-container">
                    <div className="error-message">
                        <h2>Results Not Found</h2>
                        <p>The quiz results you're looking for could not be found.</p>
                        <button onClick={() => navigate('/quiz')} className="btn-primary">
                            Back to Quiz
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="quiz-results-container">
                {/* Header */}
                <div className="results-header">
                    <h1>Quiz Results Review</h1>
                    <div className="results-actions">
                        <button 
                            onClick={handleRetakeQuiz}
                            className="btn-secondary"
                            disabled={isLoading}
                        >
                            📝 Retake Quiz
                        </button>
                        <button 
                            onClick={() => navigate('/quiz')}
                            className="btn-primary"
                        >
                            🏠 Back to Quiz Dashboard
                        </button>
                    </div>
                </div>

                {/* Results Summary */}
                <ResultsSummary 
                    summary={resultsData.summary}
                    competencyPerformance={resultsData.competencyPerformance}
                    userStats={resultsData.userStats}
                    filters={resultsData.filters}
                />

                {/* Filter Controls */}
                <div className="filter-controls">
                    <h3>Review Questions</h3>
                    <div className="filter-buttons">
                        <button 
                            className={filter === 'all' ? 'active' : ''}
                            onClick={() => {
                                setFilter('all');
                                setCurrentQuestionIndex(0);
                            }}
                        >
                            All Questions ({resultsData.questions.length})
                        </button>
                        <button 
                            className={filter === 'correct' ? 'active' : ''}
                            onClick={() => {
                                setFilter('correct');
                                setCurrentQuestionIndex(0);
                            }}
                        >
                            ✅ Correct ({resultsData.filters.correctAnswers})
                        </button>
                        <button 
                            className={filter === 'incorrect' ? 'active' : ''}
                            onClick={() => {
                                setFilter('incorrect');
                                setCurrentQuestionIndex(0);
                            }}
                        >
                            ❌ Incorrect ({resultsData.filters.incorrectAnswers})
                        </button>
                    </div>
                </div>

                {/* Question Navigation */}
                {filteredQuestions.length > 0 && (
                    <div className="question-navigation">
                        <div className="nav-controls">
                            <button 
                                onClick={() => handleQuestionNavigation('prev')}
                                disabled={currentQuestionIndex === 0}
                                className="btn-nav"
                            >
                                ← Previous
                            </button>
                            <span className="question-counter">
                                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                            </span>
                            <button 
                                onClick={() => handleQuestionNavigation('next')}
                                disabled={currentQuestionIndex === filteredQuestions.length - 1}
                                className="btn-nav"
                            >
                                Next →
                            </button>
                        </div>

                        {/* Question Quick Jump */}
                        <div className="question-jump">
                            {filteredQuestions.map((_, index) => (
                                <button
                                    key={index}
                                    className={`jump-btn ${index === currentQuestionIndex ? 'active' : ''} ${filteredQuestions[index].isCorrect ? 'correct' : 'incorrect'}`}
                                    onClick={() => jumpToQuestion(index)}
                                    title={`Question ${filteredQuestions[index].questionNumber}: ${filteredQuestions[index].isCorrect ? 'Correct' : 'Incorrect'}`}
                                >
                                    {filteredQuestions[index].questionNumber}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Current Question Display */}
                {filteredQuestions.length > 0 ? (
                    <QuestionResultCard 
                        question={filteredQuestions[currentQuestionIndex]}
                        showExplanation={true}
                    />
                ) : (
                    <div className="no-questions">
                        <p>No questions match the current filter.</p>
                    </div>
                )}

                {/* Bottom Navigation */}
                <div className="bottom-navigation">
                    <button 
                        onClick={() => navigate('/quiz')}
                        className="btn-secondary"
                    >
                        📊 View Quiz History
                    </button>
                    <button 
                        onClick={handleRetakeQuiz}
                        className="btn-primary"
                        disabled={isLoading}
                    >
                        🔄 Retake This Quiz
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default QuizResultsPage;