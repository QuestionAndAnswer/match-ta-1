--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE Users (
    id VARCHAR (36) PRIMARY KEY,
    name VARCHAR (255) NOT NULL UNIQUE,
    passhash VARCHAR (255) NOT NULL,
    passsalt VARCHAR (255) NOT NULL,
    deposit INTEGER NOT NULL,
    role VARCHAR (255) NOT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE Users;