import { Request, Response ,NextFunction, Router} from 'express';
import { asyncToResp} from './apiHandler';
import { SubjectWithRolesClaim ,extractSubjectWithRolesClaimFromJwtInAuthorizationHeader } from '../util/jwt-util';

var secureMode = false; //or true

export const secureModeApiRouter = Router();

//setting secureMode to true or false (tp , dev-only)
// GET http://localhost:8282/auth-api/dev-only/set-secure-mode/true or false renvoyant { secureMode : true_or_false}
secureModeApiRouter.route('/auth-api/public/dev-only/set-secure-mode/:mode')
.get(asyncToResp(async function(req :Request, res :Response , next: NextFunction ) {
    let mode : string = req.params.mode;
    secureMode = (mode=="true")? true : false;
    return { secureMode : secureMode};
}));

//getting current secureMode : true or false (tp , dev-only)
// GET http://localhost:8282/auth-api/dev-only/get-secure-mode renvoyant { secureMode : true_or_false}
secureModeApiRouter.route('/auth-api/public/dev-only/get-secure-mode')
.get(asyncToResp(async function(req :Request, res :Response , next: NextFunction ) {
    return { secureMode : secureMode};
}));

export function verifTokenInHeadersForPrivatePath(req :Request, res :Response , next: NextFunction ) {
    if( secureMode==false || !req.path.includes("/private/"))
       next();
    else 
       verifTokenInHeaders(req,res,next);//if secureMode==true
}

// verif bearer token in Authorization headers of request :
function verifTokenInHeaders(req :Request, res :Response , next: NextFunction ) {
    extractSubjectWithRolesClaimFromJwtInAuthorizationHeader(req.headers.authorization)
    .then((claim:SubjectWithRolesClaim)=>{
        if(checkAuthorizedPathFromRolesInJwtClaim(req.path, claim))
            next(); //ok valid jwt and role(s) in claim sufficient for authorize path
        else
            res.status(401).send("Unauthorized (valid jwt but no required role)");
    })
    .catch((err)=>{res.status(401).send("Unauthorized "+err?err:"");});//401=Unauthorized or 403=Forbidden
}

function checkAuthorizedPathFromRolesInJwtClaim(path:string,claim:SubjectWithRolesClaim):boolean{
    //console.log("path: " + path);
    //console.log("claim in jwt :" + JSON.stringify(claim));
    if(claim == null) return false;
    if(claim.roles == null || claim.roles=="") return true; //pas de verif vis ?? vis des r??les (simple jwt valide)
    let arrayUserRoles = claim.roles.split(',');
    // authorize path including /private/role_xxx/ if xxx in arrayUserRoles
    let authorized = false;
    for(let role of arrayUserRoles){
        if(path.includes("/private/role_"+role+"/"))
            authorized=true;
    }
    return authorized;
}



