

let productItemsArray = [];

const GetProductDetailsById = async (id, loginEmail) => {
    let _pool;
    let _client;
  
    try {

        let product = {};
        const key = id + loginEmail;
        product = productItemsArray.find(obj => obj.key === key);

        if (product) {
            return product?.value;
        } else {

            const pkg = await import('pg');
            const { Pool } = pkg;

            const _connectionString = "postgres://neondb_owner:npg_gsLFNfk67Czx@ep-rapid-darkness-a4rz14kn-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
            _pool = new Pool({
                connectionString: _connectionString,
                ssl: { rejectUnauthorized: false },
                connectionTimeoutMillis: 8000, // 8 seconds timeout
                idleTimeoutMillis: 10000, // keep connections idle for up to 10 seconds
                keepAlive: true
            });

            const selectQuery = `SELECT   
            uf.id AS favorite_id,
            uf.email AS favorite_email,
            uf.status,
            uf.created_at AS favorite_created_at,
            ud.id as listed_by_id,
            ud.email as listed_by_email,
            ud.name as listed_by_name,
            ud.phone as listed_by_phone,
            ud.photo_url as listed_by_photoUrl,
            p.id, 
            p.name, 
            p.category, 
            p.sub_category as subcategory, 
            p.created_at, 
            p.created_by, 
            p.status, 
            p.attributes,
            p.attributes->>'type'  AS type,
            p.attributes->>'BHK'  AS BHK,
            p.attributes->>'bathrooms'  AS bathrooms,
            p.attributes->>'furnishing'  AS furnishing
            FROM products p 
            LEFT JOIN user_favorite uf on uf.product_id = p.id  and uf.email = $1    
            LEFT JOIN user_details ud on ud.email = p.created_by
            where p.id = $2`;
             _client = await _pool.connect(); 
            const result = await _client.query(selectQuery, [loginEmail, id]);
            console.log("result?.rows", result?.rows[0]);
            const resultValue = result?.rows.length > 0 ? result.rows[0] : {};
            productItemsArray.push({ key: key, value: resultValue });
            return resultValue;
        }
    } catch (e) {
        console.error('Error get products document: ', e);
    } finally {
    _client?.release(); // Release the client back to the pool
  }
};
module.exports = { GetProductDetailsById };
