import express from "express";
import fs from "fs";
import path from "path";
import  { v4 as uuidv4} from 'uuid';
//import { verificacion1 } from "../middleware/middleware.js";
import { productMgr } from "./productManager.js";

const router = express.Router();
const productosFilePath = path.join(
  process.cwd(),
  "src",
  "dataBase",
  "cart.json"
);

class CartManager {

  constructor(path) {
    this.filePath = path;
  };
    
    // Leer datos desde un archivo JSON
    async getCarts () {
      try {
        
          if(fs.existsSync(this.filePath)){
            
            const data = await fs.promises.readFile(this.filePath, "utf8");
            return JSON.parse(data);
            
          }else{
            return -1;
          }
      } catch (error) {
        throw new Error(`Error al leer el archivo ${this.filePath}`);
      }
    };



    // Escribir datos en un archivo JSON
      async addCart () {
      try {
        if(fs.existsSync(this.filePath)){
          
                  let id = uuidv4();
                  const newCart = {
                    id: id,
                    products:[]
                  };
          
                  const carts = await this.getCarts();
                  carts.push (newCart);
                  await fs.promises.writeFile(this.filePath, JSON.stringify(carts));
                  
                  console.log(`Datos escritos en ${this.filePath}`);
                  return newCart

        }else{
          return -1;
        }
      } catch (error) {
        throw new Error(`Error al escribir en el archivo ${this.filePath}`);
      }
    };


    // traer cart por id 
    async getCartProductsById (id) {
      const carts = await this.getCarts();
      if(carts ===-1){
        return -1
      }

      const index = carts.findIndex ((cart)=>{return cart.id === id });
      if(index ===-1){
        return -1
      }

      return carts[index].products;
      
    };
    
    //agrega productos al cart

    async addProductsToCart ( cartId, productId) {
      let carts = await this.getCarts();
      if(carts ===-1){
        return -1
      }
      let cartUpdated={}
      let cartEncontrado =false;

      carts = carts.map((cart) =>{
        if(cart.id === cartId){
          cartUpdated= cart;
          cartEncontrado=true;

          if (cart.products.some((prod)=>{return productId === prod.id })){
            const index = cart.products.findIndex((prod)=>{return productId === prod.id })
            cartUpdated.products[index].quantity +=1;
          }else{
            cartUpdated.products.push({id: productId, quantity:1})

          }

          return cartUpdated
        
          } else{
          return cart;
        }
      })

      if(cartEncontrado ===false){
        return -1
      }
      await fs.promises.writeFile(this.filePath, JSON.stringify(carts));
      return cartUpdated
    };
    
};

export const cartMgr = new CartManager('./src/dataBase/cart.json');

const test = async ()=>{
   await cartMgr.getCarts();
   //await cartMgr.addCart();
   //await productMgr.getProductById(2);
   //console.log(await productMgr.getProducts()); 
  //console.log("Prod orig:",await productMgr.getProductById(3));
  //console.log("Prod modif:",await productMgr.updateProduct(3,{title:"manguerita" , stock:5, roberto:"carlos"}));
  //await productMgr.deleteProduct('978b78ee-b51f-46af-a86a-c6b9f841e89f');

  
  //console.log(await cartMgr.deleteCart());
  //console.log(await cartMgr.addCart());
  //console.log(await cartMgr.getCartProductsById('cart-1'));
  //console.log(await cartMgr.addProductsToCart('cart-1',"productoAlan"));

}

//test();

/////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ruta POST /api/products
router.post("/",  async (req, res) => {

  const cart = await cartMgr.addCart()
  if(cart === -1){
    res.status(400).send("Error al crear Cart")
  }
  res.status(200).send(cart)
})

router.get("/:cid",  async (req, res) => {
  const {cid} =req.params
  const products = await cartMgr.getCartProductsById(cid)
  if(products === -1){
    res.status(400).send("Error al encontrar el Cart, verifique que el ID sea el correcto")
  }
  res.status(200).send(products)
})

router.post("/:cid/product/:pid",  async (req, res) => {
  const {cid, pid} =req.params
  const prodExiste= await productMgr.getProductById(pid)
  
  if(prodExiste === -1){
    res.status(400).send("Error al agregar producto al Cart, verifique que el id del producto sea el correcto")
  }

  const cart = await cartMgr.addProductsToCart(cid, pid)
  if(cart === -1){
    res.status(400).send("Error al agregar producto al Cart, verifique que el id del cart sea el correcto")
  }else{

    res.status(200).send(cart)
  }
})

export { router as cartManager };
