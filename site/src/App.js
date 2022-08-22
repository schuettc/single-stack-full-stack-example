import React, { useState, useEffect } from 'react';
import NorthStarThemeProvider from 'aws-northstar/components/NorthStarThemeProvider';
import Header from 'aws-northstar/components/Header';
import './App.css';
import { AmplifyConfig as config } from './Config';
import { Amplify, API } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
Amplify.configure(config);
Amplify.Logger.LOG_LEVEL = 'DEBUG';
console.log(config.API);
const App = () => {
    const [helloWorld, setHelloWorld] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const exampleResponse = await API.post('exampleApi', 'example', {});
            console.log(exampleResponse);
            setHelloWorld(exampleResponse.message);
        };

        fetchData().catch(console.error);
    }, []);

    return (
        <NorthStarThemeProvider>
            <Header title="Single Stack Full Stack Exmaple" />
            <h2>{helloWorld}</h2>
        </NorthStarThemeProvider>
    );
};

export default App;
