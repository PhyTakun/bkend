const asyncHandler = (requestHandler) => {
  (req,res, next) =>{
    Promise.resolve(requestHandler(req,res,next)).catch(next)
  }
}

// Also, .catch(next) is a shorthand for:

// .catch((err) => next(err));






// const asyncHandler = (fn) => async(req,res,next) => {

//     try {
 
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }

// }
/*

// Step 1: Create the asyncHandler function
function asyncHandler(yourFunction) {
  
  // Step 2: Return a new function that Express can use
  return async function expressHandler(request, response, next) {
    
    // Step 3: Try to run your function
    try {
      await yourFunction(request, response, next);
    } 
    
    // Step 4: Catch any errors
    catch (error) {
      const statusCode = error.code || 500;
      response.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
}

*/




export { asyncHandler}