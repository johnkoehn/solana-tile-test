/* eslint-disable @typescript-eslint/indent */
import React from 'react';
import { Alert } from 'react-bootstrap';

const DisplayMessage = ({ message }) => {
    if (!message) {
        return (
            <>
            </>
        );
    }

    const getMessageClass = () => {
        switch (message.type) {
        case 'warning':
            return 'warning';
        case 'success':
            return 'success';
        case 'error':
            return 'danger';
        default:
            return '';
        }
    };

    return (
        <Alert variant={getMessageClass()}>
            {message.text}
        </Alert>
    );
};

export default DisplayMessage;
