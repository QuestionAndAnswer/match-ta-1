--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Products (
    id VARCHAR (36) PRIMARY KEY,
    name VARCHAR (255) NOT NULL,
    amount INTEGER NOT NULL,
    cost INTEGER NOT NULL,
    sellerId VARCHAR (36) NOT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Products;