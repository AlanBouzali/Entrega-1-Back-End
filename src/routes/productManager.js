import express from "express";
import fs from "fs";
import path from "path";
import  { v4 as uuidv4} from 'uuid';
import { verificacion1 } from "../middleware/middleware.js";

const router = express.Router();
const productosFilePath = path.join(
  process.cwd(),
  "src",
  "dataBase",
  "products.json"
);

class ProductManager {

  constructor(path) {
    this.filePath = path;
  };
    
    // Leer datos desde un archivo JSON
    async getProducts () {
      try {
        if( fs.existsSync(this.filePath)){
          const data = await fs.promises.readFile(this.filePath, "utf8");
          return JSON.parse(data);
        }else{
          return -1
        }

      } catch (error) {
        throw new Error(`Error al leer el archivo ${this.filePath}`);
      }
    };



    // Escribir datos en un archivo JSON
      async addProduct ( data) {
      try {
        let id = uuidv4();

        const products = await this.getProducts();
        if(products === -1){
          return -1
        }

        products.push ({...data, id});
        await fs.promises.writeFile(this.filePath, JSON.stringify(products));
        
        console.log(`Datos escritos en ${this.filePath}`);
        return {...data, id}
      } catch (error) {
        throw new Error(`Error al escribir en el archivo ${this.filePath}`);
      }
    };
    
    // traer producto por id 
    async getProductById (id) {
      const products = await this.getProducts();
      if(products === -1){
        return -1
      }

      const index = products.findIndex ((product)=>{return product.id === id });
      if(index === -1){
        return -1
      }
      return products[index];

    };
    
    //encontrar producto, seleccionar, modificar y devolverlo al json
    async updateProduct ( id, prodToUpdate ) {
      let products = await this.getProducts();
      if(products === -1){
        return -1
      }
      //elimino el ID para que no se borre
      let prodToUpdateNoId = prodToUpdate;
      delete prodToUpdateNoId.id;

      let prodModified = {};
      let prodEncontrado =false;
      products = products.map((prod) =>{ 
        if (prod.id === id){
          prodModified = {...prod , ...prodToUpdateNoId}
          prodEncontrado=true;
          return prodModified;
        } else {
          return prod;
        };
      });
      if(prodEncontrado === false){
        return -1
      }

      await fs.promises.writeFile(this.filePath, JSON.stringify(products));

      return prodModified;
    };

    async deleteProduct ( id){
      let products = await this.getProducts();
      if(products === -1){
        return -1
      }
      const index = products.findIndex((prod) => prod.id === id);
      if(index === -1){
        return -1
      }
    products.splice(index, 1);
    await fs.promises.writeFile(this.filePath, JSON.stringify(products));
    console.log('Producto borrado exitosamente.');
    return 'Producto borrado';
    };
};

export const productMgr = new ProductManager('./src/dataBase/products.json');

/* const test = async ()=>{
   //await productMgr.addProduct({title:"campéra"});
   //await productMgr.getProductById(2);
   console.log(await productMgr.getProducts()); 
  //console.log("Prod orig:",await productMgr.getProductById(3));
  //console.log("Prod modif:",await productMgr.updateProduct(3,{title:"manguerita" , stock:5, roberto:"carlos"}));
  await productMgr.deleteProduct('978b78ee-b51f-46af-a86a-c6b9f841e89f');
  console.log(await productMgr.getProducts());
}
 */
//test();

////////////////////////////////////////////////////////////////////////////////////////////////////////


// Ruta raíz GET /api/products
router.get("/", async (req, res) => {
  console.log("Llego");
  try {
    const { limit } = req.query;
    let products = await productMgr.getProducts();
    if(products===-1){
      res.status(400).send("Error al agregar el Producto")
    }

    if (limit) {
      products = products.slice(0, Number(limit));
    }

    res.status(200).json( products );
  } catch (error) {
    //res.status(500).send({ status: "error", message: error.message });
  }
});

// Ruta GET /api/products/:pid
router.get("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const products = await productMgr.getProductById(pid);
    if(products === -1){
      res.status(404).send("Error al obtener producto, verifique que el ID sea correcto")
    }

    /* if (!products) {
      return res
        .status(400)
        .send({ status: "error", message: "Producto no encontrado" });
    } */

    res.status(200).json(products);
  } catch (error) {
    //res.status(400).send(error);
  }
});



// Ruta POST /api/products
router.post("/", verificacion1, async (req, res) => {
  try {
    const { title, description, code, price, stock, category, thumbnails } = req.body;
    console.log(title);

    const newProd ={
      title:title,
      description:description,
      code:code,
      price:price,
      status:true,
      stock:stock,
      category:category,
      thumbnails:thumbnails,

    }
    console.log(newProd);
    const prodActualizado = await productMgr.addProduct(newProd);
      if(prodActualizado===-1){
        res.status(400).send("Error al agregar el Producto")
      }
      return res.status(400).json(prodActualizado);
  
  } catch (error) {
    //res.status(500).send({ status: "error", message: error.message });
  }
});

// Ruta PUT /api/products/:pid
router.put("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const {
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    } = req.body;

    const newProd ={
      title:title,
      description:description,
      code:code,
      price:price,
      status:true,
      stock:stock,
      category:category,
      thumbnails:thumbnails,

    };
    
    const prodModified = await productMgr.updateProduct( pid, newProd);
    if(prodModified === -1){
      res.status(400).send("No se pudo modificar el producto, verifique que el ID sea correcto")
    }

    res.status(200).json(prodModified);

  } catch (error) {
    // res.status(500).send({ status: "error", message: error.message });
  } 
});

// Ruta DELETE /api/products/:pid
router.delete("/:pid", async (req, res) => {
  try {
    const { pid } = req.params;
    const message = await productMgr.deleteProduct(pid);
    if(message === -1){
      console.log(message);
      res.status(400).send("No se pudo eliminar el producto, verifique que el ID sea correcto")
    }
    res.send(message);

    res.status(200).json(products);
  } catch (error) {
   // res.status(500).send({ status: "error", message: error.message });
  }
});

export default router;