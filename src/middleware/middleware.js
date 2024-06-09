
export const verificacion1=(req, res, next)=>{

    if(true/* req.body.title === "Alan" */){
        console.log("pasa");
        next();
    }else{
        console.log("NO pasa");
        res.send("No paso")

    }
}