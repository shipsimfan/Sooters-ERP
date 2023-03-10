use super::error::DatabaseError;
use crate::config::DatabaseInfo;
use mysql::{
    prelude::{FromRow, Queryable},
    Params, Pool,
};

pub struct Empty;

pub struct Database {
    connection: Pool,
}

struct ID(usize);

impl Database {
    pub fn connect(info: &DatabaseInfo) -> Result<Self, DatabaseError> {
        // Connect to the database
        println!(
            "Connecting to {}@{}/{} . . .",
            info.username(),
            info.address(),
            info.name()
        );
        let connection = Pool::new(
            format!(
                "mysql://{}:{}@{}/{}",
                info.username(),
                info.password(),
                info.address(),
                info.name()
            )
            .as_str(),
        )
        .map_err(|error| DatabaseError::ConnectionError(error))?;

        Ok(Database { connection })
    }

    pub async fn execute_query<Q: AsRef<str> + Send + 'static, T: FromRow + Send + 'static>(
        &self,
        query: Q,
    ) -> Result<Vec<T>, DatabaseError> {
        let pool = self.connection.clone();
        rocket::tokio::task::spawn_blocking(move || {
            pool.get_conn()
                .map_err(|_| DatabaseError::PoolError)?
                .query(query)
                .map_err(|error| DatabaseError::QueryError(error))
        })
        .await
        .unwrap()
    }

    pub async fn execute_query_parameters<
        Q: AsRef<str> + Send + 'static,
        T: FromRow + Send + 'static,
        P: Into<Params> + Send + 'static,
    >(
        &self,
        query: Q,
        params: P,
    ) -> Result<Vec<T>, DatabaseError> {
        let pool = self.connection.clone();
        rocket::tokio::task::spawn_blocking(move || {
            pool.get_conn()
                .map_err(|_| DatabaseError::PoolError)?
                .exec(query, params)
                .map_err(|error| DatabaseError::QueryError(error))
        })
        .await
        .unwrap()
    }

    pub async fn execute_query_id<
        Q: AsRef<str> + Send + 'static,
        P: Into<Params> + Send + 'static,
    >(
        &self,
        query: Q,
        params: P,
    ) -> Result<usize, DatabaseError> {
        let pool = self.connection.clone();
        rocket::tokio::task::spawn_blocking(move || {
            let mut conn = pool.get_conn().map_err(|_| DatabaseError::PoolError)?;
            let mut transaction = conn
                .start_transaction(mysql::TxOpts::default())
                .map_err(|error| DatabaseError::QueryError(error))?;

            transaction
                .exec::<Empty, _, _>(query, params)
                .map_err(|error| DatabaseError::QueryError(error))?;

            let id = transaction
                .exec::<ID, _, _>("SELECT LAST_INSERT_ID() AS ID", Params::Empty)
                .map_err(|error| DatabaseError::QueryError(error))?
                .pop()
                .unwrap();

            transaction
                .commit()
                .map_err(|error| DatabaseError::QueryError(error))
                .map(|_| id.0)
        })
        .await
        .unwrap()
    }

    pub async fn execute_transaction_id<
        Q: AsRef<str> + Send + 'static,
        P: Into<Params> + Send + 'static,
    >(
        &self,
        queries: Vec<(Q, P)>,
        id_query: Option<Q>,
    ) -> Result<usize, DatabaseError> {
        let pool = self.connection.clone();
        rocket::tokio::task::spawn_blocking(move || {
            let mut conn = pool.get_conn().map_err(|_| DatabaseError::PoolError)?;
            let mut transaction = conn
                .start_transaction(mysql::TxOpts::default())
                .map_err(|error| DatabaseError::QueryError(error))?;

            for (query, params) in queries {
                transaction
                    .exec::<Empty, _, _>(query, params)
                    .map_err(|error| DatabaseError::QueryError(error))?;
            }

            let id = transaction
                .exec::<ID, _, _>(
                    id_query
                        .as_ref()
                        .map(|id_query| id_query.as_ref())
                        .unwrap_or("SELECT LAST_INSERT_ID() AS ID"),
                    Params::Empty,
                )
                .map_err(|error| DatabaseError::QueryError(error))?
                .pop()
                .unwrap();

            transaction
                .commit()
                .map_err(|error| DatabaseError::QueryError(error))
                .map(|_| id.0)
        })
        .await
        .unwrap()
    }
}

impl FromRow for Empty {
    fn from_row_opt(_: mysql::Row) -> Result<Self, mysql::FromRowError>
    where
        Self: Sized,
    {
        Ok(Empty)
    }
}

impl FromRow for ID {
    fn from_row_opt(mut row: mysql::Row) -> Result<Self, mysql::FromRowError>
    where
        Self: Sized,
    {
        row.take("ID")
            .map(|id| ID(id))
            .ok_or(mysql::FromRowError(row))
    }
}
