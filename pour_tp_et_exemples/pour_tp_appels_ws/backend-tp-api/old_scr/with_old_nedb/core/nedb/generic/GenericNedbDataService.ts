import { BasicCrudService } from "../../itf/generic/BasicCrudService";
import { IdHelper, Auto_IdHelper } from "../../itf/generic/IdHelper";
import { NotFoundError , ErrorWithStatus, ConflictError} from "../../../error/errorWithStatus";
import NeDb = require('nedb');
import { MyNedbPseudoConnectionMap } from "./GenericNedbConnection";
import { myAppConnectionMap } from "../../db-connections"

export class GenericNedbDataService<T,ID> implements BasicCrudService<T,ID>{

    //collectionName must be  replaced/override in subclass:
    

    // idHelper may be replaced/override in subclass:
              //by default _id (auto generated by mongoDB)
              //may be overrided by static _id (copy_or_renaming of .num or .code)

    constructor(protected connectionName : string,
                protected collectionName : string , 
                protected idHelper : IdHelper<T,ID>  = new Auto_IdHelper<T,ID>()){
    }

    //nedBMap() = utility function for accessing NeDB connectionMap initialized in myAppConnectionMap
    private nedBMap() : Map<string,Nedb>{
        let  myNedbConnectionMap : MyNedbPseudoConnectionMap = 
            myAppConnectionMap.getConnection(this.connectionName) as MyNedbPseudoConnectionMap;
        return myNedbConnectionMap.currentDb();
    }

    //nedbForCollectionOrStore(storeName) = utility function for accessing NeDB connection (for a specific store/collection)
    //in myNedbConnectionMap initialized in myAppConnectionMap
    private nedbForCollectionOrStore(storeName:string="default") : Promise<NeDb>{
        let neDbMap = this.nedBMap();

        return new Promise((resolve,reject) => {
            let  myNedbConnection : Nedb = neDbMap.get(storeName);
            if(myNedbConnection!=null)
                resolve(myNedbConnection);
            else{
                let  myNedbConnectionMap : MyNedbPseudoConnectionMap = 
                    myAppConnectionMap.getConnection(this.connectionName) as MyNedbPseudoConnectionMap;
                myNedbConnectionMap.openConnection(storeName)
                    .then( (msg) => { resolve(this.nedBMap().get(storeName)); })
                    .catch( (err) => reject(err));
            }
        });
    }  

    private nedbForCurrentCollectionOrStore() : Promise<NeDb>{
        return this.nedbForCollectionOrStore(this.collectionName);
    }

    private buildQueryByIdOfEntity(dataObj: T) : object{
        return this.buildQueryById( this.idHelper.extractId(dataObj));
    }

    private buildQueryById(id: ID) : object{
        let query = null;
        let mongoIdAsString : string = id as any as string;
        if(this.idHelper.isAuto()){
            query = { '_id' : /*new ObjectID(*/mongoIdAsString/*)*/};
        }else{
            query = { '_id' : mongoIdAsString };
            //.id in mongoDB is an alias for .code or .id or .num in persistent entity
        }
        return query;
    }
    private adjustEntitiesId(entities:T[]){
        if(this.idHelper.getIdPropName() != "_id"){
            for(let e of entities){
                this.adjustEntityId(e)
            }
        }
        return entities;
    }

    private adjustEntityId(e:T):T{
        if(this.idHelper.getIdPropName() != "_id"){
            //remplacer .id="valeurPk" par .idPropName="valeurPk":  
            let id = Reflect.get(e as any as object ,"_id");
            Reflect.set(e as any as object,this.idHelper.getIdPropName(),id);
            Reflect.deleteProperty(e as any as object,"_id");
        }
        return e;
    }

    private adjustMongoId(e:T):T{
        if(this.idHelper.getIdPropName() != "_id"){
            //remplacer  .idPropName="valeurPk" par   .id="valeurPk" :
            let pkValue = Reflect.get(e as any as object ,this.idHelper.getIdPropName());
            Reflect.set(e as any as object,"_id",pkValue);
            Reflect.deleteProperty(e as any as object,this.idHelper.getIdPropName());
        }
        return e;
    }

    private adjustMongoIdForInsert(e:T):T{
        e=this.adjustMongoId(e); //remplace si besoin .pkName par ._id

        //contrairement à MongoDB, Nedb va auto générer le _id
        //que si l'attibut _id n'existe pas (il ne faut pas null mais pas de _id du tout)
        if(this.idHelper.isAuto()){
            let pkValue = Reflect.get(e as any as object ,"_id");
            if(pkValue==null)
               Reflect.deleteProperty(e as any as object,"_id");
        }
        return e;
    }


    public insert(dataObj: T): Promise<T> {
        return new Promise((resolve,reject) => {
            this.nedbForCurrentCollectionOrStore().then ( (nedb)=> { nedb
                   .insert(this.adjustMongoIdForInsert(dataObj),(err, result) =>{
                        if(err!=null) {
                            console.log("genericInsert error = " + err);
                            if(err.name=='uniqueViolated')
                               reject(new ConflictError("insertOne conflict exception (duplicate primary key)  "+JSON.stringify(dataObj)));
                            else
                               reject(new ErrorWithStatus("insertOne exception with ="+JSON.stringify(dataObj) + " " + err.message ));
                        }else{
                            //console.log() ???
                            resolve(this.adjustEntityId(result)); 
                        }
                   }
                ); //end of insertOne
            });//end of this.dB().then()
        });//end of Promise
    }    

    saveOrUpdate(dataObj: T): Promise<T> {
        //console.log("in saveOrUpdate() , dataObj="+JSON.stringify(dataObj));
        let id : ID = this.idHelper.extractId(dataObj);
        //console.log("in saveOrUpdate() , id="+id);
        
        if(this.idHelper.isAuto() && id==null){
                return this.insert(dataObj);
        }else{
            //NB: autre solution: coder et appeler un update() with upsert option.
            return new Promise((resolve,reject) => {
                 this.findById(id)
                 .then((existingEntityToUpdate)=>{
                     //console.log("existing - need to be updated");
                     this.update(dataObj).then((res)=>{resolve(res);})
                                         .catch((err)=>{reject(err)})
                  })
                 .catch((notFoundErr)=>{
                    //console.log("non existing - need to be inserted");
                    this.insert(dataObj).then((res)=>{resolve(res);})
                                        .catch((err)=>{reject(err)})
                 });
            });
        }
    }

    update(dataObj: T): Promise<T> {
        let query = this.buildQueryByIdOfEntity(dataObj);
        let changes : object  = JSON.parse(JSON.stringify(dataObj))  as object; //clonage
        Reflect.deleteProperty(changes,this.idHelper.getIdPropName());//id/pk immutable (cannot change)
        return new Promise((resolve,reject) => {
            this.nedbForCurrentCollectionOrStore().then ( (nedb)=> { nedb
                   .update(query , { $set : changes } ,{},(err, nbReplaced) => {
                        if(err!=null) {
                            console.log("genericUpdate error = " + err);
                            reject(new ErrorWithStatus("updateOne exception with dataObj="+JSON.stringify(dataObj)));
                        }else{
                            if(nbReplaced==1)
                                resolve(dataObj); 
                            else 
                               reject(new NotFoundError("updateOne exception with dataObj="+JSON.stringify(dataObj)));
                        }
                   }
                ); //end of updateOne
             });//end of this.dB().then()
        });//end of Promise
    }

    
    
    public findById(id: ID): Promise<T> {
        let query = this.buildQueryById(id);
        return this.findOne(query);
    }

    
    findOne(query: any): Promise<T> {
        return new Promise((resolve,reject) => {
            this.nedbForCurrentCollectionOrStore().then ( (nedb)=> { 
                   nedb.findOne(query , (err, item) => {
                        if(err!=null) {
                            console.log("genericFindOne error = " + err);
                            reject(new NotFoundError("not found (query="+JSON.stringify(query)+")"));
                        }else{ //NB: item may be null if not found
                            if(item)
                                resolve(this.adjustEntityId(item)); 
                            else 
                                reject(new NotFoundError("not found (query="+JSON.stringify(query)+")"));
                        }
                   }
                ); //end of findOne
            });//end of this.dB().then()
        });//end of Promise
    }
    
    findList(query: any): Promise<T[]> {
        return new Promise((resolve,reject) => {
            this.nedbForCurrentCollectionOrStore().then ( (nedb)=> { 
                nedb.find( query ,  (err:any, arr:any) => {
                        if(err!=null) {
                            console.log("genericfindList error = " + err);
                            reject(new ErrorWithStatus("findList exception with query="+query));
                        }else{
                        resolve(this.adjustEntitiesId(arr)); 
                        }
                    }); //end of find
            });//end of this.....then()
        });
    }

    public findAll(): Promise<T[]> {
        return this.findList({});
    }

    remove(query: any): Promise<void> {
        return new Promise((resolve,reject) => {
            this.nedbForCurrentCollectionOrStore().then ( (nedb)=> { nedb
                   .remove(query , function(err, numRemoved) {
                        if(err!=null) {
                            console.log("genericRemove error = " + err);
                            reject(new ErrorWithStatus("remove exception with query="+query));
                        }else{
                            console.log(numRemoved+" document(s) deleted");
                            resolve(); 
                        }
                   }
                ); //end of remove
            });//end of this.dB().then()
         });//end of Promise
    }

    deleteById(id: ID): Promise<void> {
        let query = this.buildQueryById(id);
        return new Promise((resolve,reject) => {
            this.nedbForCurrentCollectionOrStore().then ( (nedb)=> { nedb
                   .remove(query , function(err, numRemoved) {
                        if(err!=null) {
                            console.log("genericDeleteById error = " + err);
                            reject(new ErrorWithStatus("deleteOne exception / internal error"));
                        }else{
                            //console.log(numRemoved + " document deleted");
                            if(numRemoved == 1)
                                 resolve();
                            else  reject(new NotFoundError("deleteOne exception with id="+id));
                        }
                   }
                ); //end of deleteOne
            });//end of this.dB().then()
        });//end of Promise
    }


}