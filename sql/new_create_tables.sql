CREATE TABLE IF NOT EXISTS public.users
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    wallet_balance numeric(10,2) DEFAULT 1000.00,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    amount float NOT NULL,
    order_executed timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL,
    type varchar(50) NOT NULL CHECK (type IN ('buy', 'sell')),
    stock_id varchar(50) NOT NULL,
    price float NOT NULL,
    quantity float NOT NULL,
    CONSTRAINT stock_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.money_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    amount float NOT NULL,
    order_executed timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL,
    type varchar(50) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    bank varchar(50) NOT NULL,
    CONSTRAINT money_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON DELETE CASCADE
);