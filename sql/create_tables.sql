-- CREATE scripts

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

CREATE TABLE IF NOT EXISTS public.stocks
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticker character varying(10) COLLATE pg_catalog."default" NOT NULL,
    longname character varying(255) COLLATE pg_catalog."default" NOT NULL,
    instrumenttype character varying(50) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT stocks_pkey PRIMARY KEY (id),
    CONSTRAINT stocks_ticker_key UNIQUE (ticker)
);

CREATE TABLE IF NOT EXISTS public.prices
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticker character varying(10) COLLATE pg_catalog."default" NOT NULL,
    regularmarketprice numeric(10,2),
    fiftytwoweekhigh numeric(10,2),
    fiftytwoweeklow numeric(10,2),
    regularmarketdayhigh numeric(10,2),
    regularmarketdaylow numeric(10,2),
    regularmarketvolume bigint,
    date date NOT NULL,
    open numeric(10,2),
    high numeric(10,2),
    low numeric(10,2),
    close numeric(10,2),
    volume bigint,
    CONSTRAINT price_pkey PRIMARY KEY (id),
    CONSTRAINT unique_ticker_date UNIQUE (ticker, date)
);

CREATE TABLE IF NOT EXISTS public.sentiments
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticker character varying(10) COLLATE pg_catalog."default" NOT NULL,
    date date NOT NULL,
    sentiment numeric(6,3) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sentiment_pkey PRIMARY KEY (id),
    CONSTRAINT sentiment_ticker_date_unique UNIQUE (ticker, date),
    CONSTRAINT unique_ticker UNIQUE (ticker)
);

CREATE TABLE IF NOT EXISTS public.news
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ticker character varying(10) COLLATE pg_catalog."default" NOT NULL,
    url text COLLATE pg_catalog."default" NOT NULL,
    img text COLLATE pg_catalog."default",
    title text COLLATE pg_catalog."default" NOT NULL,
    text text COLLATE pg_catalog."default",
    source character varying(100) COLLATE pg_catalog."default",
    type character varying(50) COLLATE pg_catalog."default",
    "time" timestamp with time zone,
    date date,
    ago character varying(50) COLLATE pg_catalog."default",
    CONSTRAINT news_pkey PRIMARY KEY (id),
    CONSTRAINT news_ticker_url_key UNIQUE (ticker, url)
);

CREATE TABLE IF NOT EXISTS public.esg
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    companyname character varying(255) COLLATE pg_catalog."default",
    industry character varying(100) COLLATE pg_catalog."default",
    country character varying(100) COLLATE pg_catalog."default",
    exchangename character varying(100) COLLATE pg_catalog."default",
    ticker character varying(100) COLLATE pg_catalog."default",
    year integer,
    overall_score numeric(15,10),
    overall_transparency_score numeric(15,10),
    environmental_pillar_score numeric(15,10),
    social_pillar_score numeric(15,10),
    governance_pillar_score numeric(15,10),
    overall_score_global_rank character varying(50) COLLATE pg_catalog."default",
    overall_industry_rank character varying(50) COLLATE pg_catalog."default",
    overall_region_rank character varying(50) COLLATE pg_catalog."default",
    latest_score_date date,
    CONSTRAINT esg_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.stock_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    amount float NOT NULL,
    order_executed timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL,
    type varchar(50) NOT NULL CHECK (type IN ('buy', 'sell')),
    stock_id uuid NOT NULL,
    price float NOT NULL,
    quantity float NOT NULL,
    CONSTRAINT stock_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_stock
        FOREIGN KEY (stock_id)
        REFERENCES public.stocks (id)
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

CREATE TABLE IF NOT EXISTS public.portfolios
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    stock_id uuid NOT NULL,
    quantity double precision NOT NULL,
    CONSTRAINT unique_user_stock UNIQUE (user_id, stock_id),
    CONSTRAINT fk_stock FOREIGN KEY (stock_id)
        REFERENCES public.stocks (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

-- INSERT scripts
INSERT INTO public.stocks (ticker, longname, instrumenttype)
VALUES
    ('AAPL', 'Apple Inc.', 'Equity'),
    ('MSFT', 'Microsoft Corporation', 'Equity'),
    ('AMZN', 'Amazon.com, Inc.', 'Equity'),
    ('GOOGL', 'Alphabet Inc. Class A', 'Equity'),
    ('TSLA', 'Tesla, Inc.', 'Equity');

INSERT INTO esg (
    companyname, industry, country, exchangename, ticker, year, overall_score, overall_transparency_score,
    environmental_pillar_score, social_pillar_score, governance_pillar_score, overall_score_global_rank,
    overall_industry_rank, overall_region_rank, latest_score_date
)
VALUES (
    'Apple Inc.', 'Technology Hardware, Storage and Peripherals', 'United States', 'Nasdaq Global Select', 'AAPL', 2024,
    76.9537988446, 85.6499183468, 87.8947994075, 78.1952067557, 68.4578155684, '545/21070', '8/176', '116/4166',
    '2024-09-22 16:00:00'
), (
    'Microsoft Corporation', 'Software', 'United States', 'Nasdaq Global Select', 'MSFT', 2024,
    79.1359127156, 95.4733722655, 50.6910928285, 87.3391823071, 78.7793823972, '372/21070', '14/660', '79/4166',
    '2024-09-22 16:00:00'
), (
    'Tesla, Inc.', 'Automobiles', 'United States', 'Nasdaq Global Select', 'TSLA', 2024,
    49.0913344027, 97.9808335287, 46.6702622364, 43.0736719132, 58.5746841779, '8222/21070', '44/102', '1985/4166',
    '2024-09-22 16:00:00'
), (
    'Amazon.com, Inc.', 'Broadline Retail', 'United States', 'Nasdaq Global Select', 'AMZN', 2024,
    53.1146744202, 84.4718679394, 43.1650790071, 52.6115573254, 57.9861682047, '6399/21070', '52/142', '1540/4166',
    '2024-09-22 16:00:00'
), (
    'Alphabet Inc.', 'Interactive Media and Services', 'United States', 'Nasdaq Global Select', 'GOOGL', 2024,
    64.7450395593, 94.2310955535, 75.2140528472, 78.5925478109, 38.1882775298, '2405/21070', '20/150', '571/4166',
    '2024-09-22 16:00:00'
);

INSERT INTO public.prices (ticker, regularmarketprice, fiftytwoweekhigh, fiftytwoweeklow, regularmarketdayhigh, regularmarketdaylow, regularmarketvolume, date, open, high, low, close, volume)
VALUES
    ('AAPL', 145.30, 157.00, 120.00, 146.50, 144.00, 98000000, '2024-09-24', 143.50, 146.20, 142.30, 145.30, 90000000),
    ('MSFT', 298.67, 350.00, 240.00, 300.00, 295.00, 65000000, '2024-09-24', 295.00, 302.00, 294.00, 298.67, 60000000),
    ('AMZN', 132.40, 150.00, 85.00, 133.50, 130.00, 75000000, '2024-09-24', 130.50, 134.00, 129.00, 132.40, 72000000),
    ('GOOGL', 142.25, 150.00, 100.00, 143.50, 140.00, 30000000, '2024-09-24', 140.00, 143.00, 139.00, 142.25, 29000000),
    ('TSLA', 275.50, 330.00, 150.00, 277.00, 272.00, 80000000, '2024-09-24', 272.00, 278.00, 270.00, 275.50, 78000000),
    ('AAPL', 145.30, 157.00, 120.00, 146.50, 144.00, 98000000, '2024-09-25', 143.50, 146.20, 142.30, 145.30, 90000000),
    ('MSFT', 298.67, 350.00, 240.00, 300.00, 295.00, 65000000, '2024-09-25', 295.00, 302.00, 294.00, 298.67, 60000000),
    ('AMZN', 132.40, 150.00, 85.00, 133.50, 130.00, 75000000, '2024-09-25', 130.50, 134.00, 129.00, 132.40, 72000000),
    ('GOOGL', 142.25, 150.00, 100.00, 143.50, 140.00, 30000000, '2024-09-25', 140.00, 143.00, 139.00, 142.25, 29000000),
    ('TSLA', 275.50, 330.00, 150.00, 277.00, 272.00, 80000000, '2024-09-25', 272.00, 278.00, 270.00, 275.50, 78000000);

INSERT INTO public.sentiments (ticker, date, sentiment) 
VALUES 
    ('AAPL', '2024-09-02', 0.600),
    ('MSFT', '2024-09-02', 0.650),
    ('GOOGL', '2024-09-02', 0.680),
    ('AMZN', '2024-09-02', 0.580),
    ('TSLA', '2024-09-02', 0.850);