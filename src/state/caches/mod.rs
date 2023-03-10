use super::{database::Database, error::StateCreationError};

mod database;
mod file;
mod image;

pub use database::DatabaseCache;
pub use file::{FileCache, FilePath};
pub use image::ImageCache;

const JS_BASE_PATH: &'static str = "./js/";
const CSS_BASE_PATH: &'static str = "./css/";
const IMAGE_BASE_PATH: &'static str = "./images/";

pub(super) struct Caches {
    js_cache: FileCache,
    css_cache: FileCache,
    image_cache: ImageCache,
    database_cache: DatabaseCache,
}

impl Caches {
    pub(super) async fn load(database: &mut Database) -> Result<Self, StateCreationError> {
        // Load javascript
        let js_cache = FileCache::load(JS_BASE_PATH)
            .map_err(|error| StateCreationError::JSLoadError(error))?;

        #[cfg(debug_assertions)]
        {
            println!("JS Loaded:");
            js_cache.print();
        }

        // Load CSS
        let css_cache = FileCache::load(CSS_BASE_PATH)
            .map_err(|error| StateCreationError::CSSLoadError(error))?;

        #[cfg(debug_assertions)]
        {
            println!("CSS Loaded:");
            css_cache.print();
        }

        // Load images
        let image_cache = ImageCache::load(IMAGE_BASE_PATH)
            .map_err(|error| StateCreationError::ImageLoadError(error))?;

        // Load database
        let database_cache = DatabaseCache::load(database).await?;

        Ok(Caches {
            js_cache,
            css_cache,
            image_cache,
            database_cache,
        })
    }

    pub(super) fn js(&self) -> &FileCache {
        &self.js_cache
    }

    pub(super) fn css(&self) -> &FileCache {
        &self.css_cache
    }

    pub(super) fn images(&self) -> &ImageCache {
        &self.image_cache
    }

    pub(super) fn database_cache(&self) -> &DatabaseCache {
        &self.database_cache
    }
}
