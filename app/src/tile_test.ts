export type TileTest = {
    'version': '0.0.0',
    'name': 'tile_test',
    'instructions': [
        {
            'name': 'initialize',
            'accounts': [
                {
                    'name': 'gameAccount',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'newTile',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'tileMint',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'resourceMint',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'authority',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'receiver',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'destination',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'systemProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'tokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'associatedTokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'rent',
                    'isMut': false,
                    'isSigner': false
                }
            ],
            'args': [
                {
                    'name': 'tileType',
                    'type': {
                        'defined': 'TileTypes'
                    }
                },
                {
                    'name': 'tilesFromCenter',
                    'type': 'u8'
                },
                {
                    'name': 'tileMintBump',
                    'type': 'u8'
                },
                {
                    'name': 'tileMintSeed',
                    'type': 'string'
                },
                {
                    'name': 'resourceMintBump',
                    'type': 'u8'
                },
                {
                    'name': 'resourceMintSeed',
                    'type': 'string'
                }
            ]
        },
        {
            'name': 'mintTile',
            'accounts': [
                {
                    'name': 'newTile',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'tileMint',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'resourceMint',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'gameAccount',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'currentTile',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'authority',
                    'isMut': true,
                    'isSigner': true
                },
                {
                    'name': 'receiver',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'destination',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'systemProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'tokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'associatedTokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'rent',
                    'isMut': false,
                    'isSigner': false
                }
            ],
            'args': [
                {
                    'name': 'tileType',
                    'type': {
                        'defined': 'TileTypes'
                    }
                },
                {
                    'name': 'tileMintBump',
                    'type': 'u8'
                },
                {
                    'name': 'tileMintSeed',
                    'type': 'string'
                },
                {
                    'name': 'resourceMintBump',
                    'type': 'u8'
                },
                {
                    'name': 'resourceMintSeed',
                    'type': 'string'
                }
            ]
        },
        {
            'name': 'generateResource',
            'accounts': [
                {
                    'name': 'tile',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'tileTokenAccount',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'resourceMint',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'resourceTokenAccount',
                    'isMut': true,
                    'isSigner': false
                },
                {
                    'name': 'authority',
                    'isMut': false,
                    'isSigner': true
                },
                {
                    'name': 'systemProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'associatedTokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'tokenProgram',
                    'isMut': false,
                    'isSigner': false
                },
                {
                    'name': 'rent',
                    'isMut': false,
                    'isSigner': false
                }
            ],
            'args': [
                {
                    'name': 'resourceMintBump',
                    'type': 'u8'
                },
                {
                    'name': 'resourceMintSeed',
                    'type': 'string'
                }
            ]
        }
    ],
    'accounts': [
        {
            'name': 'tileAccount',
            'type': {
                'kind': 'struct',
                'fields': [
                    {
                        'name': 'mintKey',
                        'type': 'publicKey'
                    },
                    {
                        'name': 'resourceKey',
                        'type': 'publicKey'
                    },
                    {
                        'name': 'q',
                        'type': 'i16'
                    },
                    {
                        'name': 'r',
                        'type': 'i16'
                    },
                    {
                        'name': 'tileType',
                        'type': {
                            'defined': 'TileTypes'
                        }
                    },
                    {
                        'name': 'nextTile',
                        'type': {
                            'option': 'publicKey'
                        }
                    }
                ]
            }
        },
        {
            'name': 'gameAccount',
            'type': {
                'kind': 'struct',
                'fields': [
                    {
                        'name': 'firstTileKey',
                        'type': 'publicKey'
                    },
                    {
                        'name': 'currentTileKey',
                        'type': 'publicKey'
                    },
                    {
                        'name': 'maxTiles',
                        'type': 'u64'
                    },
                    {
                        'name': 'currentNumberOfTiles',
                        'type': 'u64'
                    },
                    {
                        'name': 'maxTilesFromCenter',
                        'type': 'u8'
                    }
                ]
            }
        }
    ],
    'types': [
        {
            'name': 'TileTypes',
            'type': {
                'kind': 'enum',
                'variants': [
                    {
                        'name': 'Wood'
                    },
                    {
                        'name': 'Gold'
                    },
                    {
                        'name': 'Wheat'
                    },
                    {
                        'name': 'Iron'
                    }
                ]
            }
        }
    ],
    'errors': [
        {
            'code': 300,
            'name': 'WrongTile',
            'msg': 'Not the most recent tile'
        },
        {
            'code': 301,
            'name': 'WrongMint',
            'msg': 'Not the correct resource mint for the tile'
        },
        {
            'code': 302,
            'name': 'WrongTokenAccount',
            'msg': 'Not the correct token account for the tile'
        },
        {
            'code': 303,
            'name': 'NoNFT',
            'msg': 'The account does not the NFT for the tile'
        },
        {
            'code': 304,
            'name': 'MaxTiles',
            'msg': 'The game has minted the max number of tiles'
        }
    ]
};

export const IDL: TileTest = {
    version: '0.0.0',
    name: 'tile_test',
    instructions: [
        {
            name: 'initialize',
            accounts: [
                {
                    name: 'gameAccount',
                    isMut: true,
                    isSigner: true
                },
                {
                    name: 'newTile',
                    isMut: true,
                    isSigner: true
                },
                {
                    name: 'tileMint',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'resourceMint',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'authority',
                    isMut: true,
                    isSigner: true
                },
                {
                    name: 'receiver',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'destination',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false
                }
            ],
            args: [
                {
                    name: 'tileType',
                    type: {
                        defined: 'TileTypes'
                    }
                },
                {
                    name: 'tilesFromCenter',
                    type: 'u8'
                },
                {
                    name: 'tileMintBump',
                    type: 'u8'
                },
                {
                    name: 'tileMintSeed',
                    type: 'string'
                },
                {
                    name: 'resourceMintBump',
                    type: 'u8'
                },
                {
                    name: 'resourceMintSeed',
                    type: 'string'
                }
            ]
        },
        {
            name: 'mintTile',
            accounts: [
                {
                    name: 'newTile',
                    isMut: true,
                    isSigner: true
                },
                {
                    name: 'tileMint',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'resourceMint',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'gameAccount',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'currentTile',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'authority',
                    isMut: true,
                    isSigner: true
                },
                {
                    name: 'receiver',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'destination',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false
                }
            ],
            args: [
                {
                    name: 'tileType',
                    type: {
                        defined: 'TileTypes'
                    }
                },
                {
                    name: 'tileMintBump',
                    type: 'u8'
                },
                {
                    name: 'tileMintSeed',
                    type: 'string'
                },
                {
                    name: 'resourceMintBump',
                    type: 'u8'
                },
                {
                    name: 'resourceMintSeed',
                    type: 'string'
                }
            ]
        },
        {
            name: 'generateResource',
            accounts: [
                {
                    name: 'tile',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'tileTokenAccount',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'resourceMint',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'resourceTokenAccount',
                    isMut: true,
                    isSigner: false
                },
                {
                    name: 'authority',
                    isMut: false,
                    isSigner: true
                },
                {
                    name: 'systemProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'associatedTokenProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'tokenProgram',
                    isMut: false,
                    isSigner: false
                },
                {
                    name: 'rent',
                    isMut: false,
                    isSigner: false
                }
            ],
            args: [
                {
                    name: 'resourceMintBump',
                    type: 'u8'
                },
                {
                    name: 'resourceMintSeed',
                    type: 'string'
                }
            ]
        }
    ],
    accounts: [
        {
            name: 'tileAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'mintKey',
                        type: 'publicKey'
                    },
                    {
                        name: 'resourceKey',
                        type: 'publicKey'
                    },
                    {
                        name: 'q',
                        type: 'i16'
                    },
                    {
                        name: 'r',
                        type: 'i16'
                    },
                    {
                        name: 'tileType',
                        type: {
                            defined: 'TileTypes'
                        }
                    },
                    {
                        name: 'nextTile',
                        type: {
                            option: 'publicKey'
                        }
                    }
                ]
            }
        },
        {
            name: 'gameAccount',
            type: {
                kind: 'struct',
                fields: [
                    {
                        name: 'firstTileKey',
                        type: 'publicKey'
                    },
                    {
                        name: 'currentTileKey',
                        type: 'publicKey'
                    },
                    {
                        name: 'maxTiles',
                        type: 'u64'
                    },
                    {
                        name: 'currentNumberOfTiles',
                        type: 'u64'
                    },
                    {
                        name: 'maxTilesFromCenter',
                        type: 'u8'
                    }
                ]
            }
        }
    ],
    types: [
        {
            name: 'TileTypes',
            type: {
                kind: 'enum',
                variants: [
                    {
                        name: 'Wood'
                    },
                    {
                        name: 'Gold'
                    },
                    {
                        name: 'Wheat'
                    },
                    {
                        name: 'Iron'
                    }
                ]
            }
        }
    ],
    errors: [
        {
            code: 300,
            name: 'WrongTile',
            msg: 'Not the most recent tile'
        },
        {
            code: 301,
            name: 'WrongMint',
            msg: 'Not the correct resource mint for the tile'
        },
        {
            code: 302,
            name: 'WrongTokenAccount',
            msg: 'Not the correct token account for the tile'
        },
        {
            code: 303,
            name: 'NoNFT',
            msg: 'The account does not the NFT for the tile'
        },
        {
            code: 304,
            name: 'MaxTiles',
            msg: 'The game has minted the max number of tiles'
        }
    ]
};
