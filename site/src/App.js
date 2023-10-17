import React, { useState, useEffect } from 'react';
import { ContentLayout, Container, Header, SpaceBetween } from '@cloudscape-design/components';
import '@cloudscape-design/global-styles/index.css';
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
        <ContentLayout
            header={
                <SpaceBetween size="m">
                    <Header variant="h1">Single Stack Full Stack Example</Header>
                </SpaceBetween>
            }
        >
            <Container>
                <h2>{helloWorld}</h2>
            </Container>
        </ContentLayout>
    );
};

export default App;
