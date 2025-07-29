import React, { useState, useEffect } from 'react';
import progressService from '../api/progressService';

const StarTest = () => {
    const [starCount, setStarCount] = useState(0);
    const [testResults, setTestResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const addTestResult = (message, success = true) => {
        const timestamp = new Date().toLocaleTimeString();
        setTestResults(prev => [...prev, { 
            message, 
            success, 
            timestamp,
            id: Date.now() 
        }]);
    };

    const testStarCount = async () => {
        setIsLoading(true);
        addTestResult('🧪 Testing star count fetch...', true);
        
        try {
            const result = await progressService.getStarCount();
            addTestResult(`✅ Star count fetched: ${result.totalStars} stars`, true);
            addTestResult(`📝 Result details: ${JSON.stringify(result, null, 2)}`, true);
            setStarCount(result.totalStars || 0);
        } catch (error) {
            addTestResult(`❌ Error fetching star count: ${error.message}`, false);
            addTestResult(`🔍 Error details: ${JSON.stringify({
                status: error.status,
                code: error.code,
                url: error.config?.url
            }, null, 2)}`, false);
        }
        setIsLoading(false);
    };

    const testAwardStar = async () => {
        setIsLoading(true);
        const testSkillId = 'hand-hygiene';
        const testLessonType = 'chat';
        
        addTestResult(`🌟 Testing star award for ${testSkillId} (${testLessonType})...`, true);
        
        try {
            const result = await progressService.awardStar(testSkillId, testLessonType);
            addTestResult(`✅ Star awarded: ${JSON.stringify(result, null, 2)}`, true);
            
            // Refetch star count
            await testStarCount();
        } catch (error) {
            addTestResult(`❌ Error awarding star: ${error.message}`, false);
        }
        setIsLoading(false);
    };

    const testProgressSummary = async () => {
        setIsLoading(true);
        addTestResult('📊 Testing progress summary fetch...', true);
        
        try {
            const result = await progressService.getProgressSummary();
            addTestResult(`✅ Progress summary fetched successfully`, true);
            addTestResult(`📈 Completed chat sessions: ${result.completedChatSessions || 0}`, true);
            addTestResult(`🎯 Completed simulations: ${result.completedSimulations || 0}`, true);
            addTestResult(`📝 Full summary: ${JSON.stringify(result, null, 2)}`, true);
        } catch (error) {
            addTestResult(`❌ Error fetching progress summary: ${error.message}`, false);
        }
        setIsLoading(false);
    };

    const clearLocalStars = () => {
        // Clear all localStorage star data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('star_') || key === 'totalStars')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        addTestResult(`🧹 Cleared ${keysToRemove.length} star-related localStorage items`, true);
        setStarCount(0);
    };

    const clearTestResults = () => {
        setTestResults([]);
    };

    useEffect(() => {
        // Run initial test
        testStarCount();
    }, []);

    return (
        <div style={{ 
            padding: '20px', 
            maxWidth: '800px', 
            margin: '0 auto',
            fontFamily: 'monospace'
        }}>
            <h2>⭐ Star System Test Console</h2>
            
            <div style={{ 
                background: '#f8f9fa', 
                padding: '15px', 
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h3>Current Status</h3>
                <p><strong>Star Count:</strong> {starCount} ⭐</p>
                <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>Test Actions</h3>
                <button 
                    onClick={testStarCount} 
                    disabled={isLoading}
                    style={{ margin: '5px', padding: '8px 16px' }}
                >
                    Test Star Count
                </button>
                <button 
                    onClick={testAwardStar} 
                    disabled={isLoading}
                    style={{ margin: '5px', padding: '8px 16px' }}
                >
                    Test Award Star
                </button>
                <button 
                    onClick={testProgressSummary} 
                    disabled={isLoading}
                    style={{ margin: '5px', padding: '8px 16px' }}
                >
                    Test Progress Summary
                </button>
                <button 
                    onClick={clearLocalStars}
                    style={{ margin: '5px', padding: '8px 16px', background: '#dc3545', color: 'white' }}
                >
                    Clear Local Stars
                </button>
                <button 
                    onClick={clearTestResults}
                    style={{ margin: '5px', padding: '8px 16px', background: '#6c757d', color: 'white' }}
                >
                    Clear Results
                </button>
            </div>

            <div style={{ 
                background: '#000', 
                color: '#00ff00', 
                padding: '15px', 
                borderRadius: '8px',
                maxHeight: '400px',
                overflowY: 'auto'
            }}>
                <h3 style={{ color: '#00ff00' }}>Test Results Console</h3>
                {testResults.length === 0 ? (
                    <p>No test results yet...</p>
                ) : (
                    testResults.map((result) => (
                        <div 
                            key={result.id} 
                            style={{ 
                                marginBottom: '10px',
                                color: result.success ? '#00ff00' : '#ff6b6b'
                            }}
                        >
                            <span style={{ color: '#888' }}>[{result.timestamp}]</span> {result.message}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default StarTest;