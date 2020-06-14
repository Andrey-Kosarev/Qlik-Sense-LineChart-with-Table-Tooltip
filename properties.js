define([], function(){
    'use strict';
    return{
        type: 'items', 
        component: 'accordion',
        items: {
            dimensions:{
                uses: 'dimensions', 
                min:2,
                max:2
            },
            measures: {
                uses:'measures',
                min: 1,
                max: 1 
            }
            
        }
    }
})