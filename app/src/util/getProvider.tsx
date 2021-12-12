import { Commitment, Connection } from '@solana/web3.js';
import { Provider } from '@project-serum/anchor';

const getProvider = (wallet: any, network: string) => {
    const connectionType: Commitment = 'processed';

    const connection = new Connection(network, connectionType);

    const provider = new Provider(
        connection, wallet, { commitment: connectionType }
    );

    return provider;
};

export default getProvider;
