# [seneca-entity](http://senecajs.org) *3.3.0*

> Entity plugin for seneca


### lib/make_entity.js


#### Entity.save$([data], done) 

Save the entity. 




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| data | `object`  | - Subset of entity field values. | *Optional* |
| done |  | - Callback function providing saved entity. | &nbsp; |




##### Returns


- `Void`



#### Entity.load$([query], done) 

Load the entity. 




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| query | `object` `string` `number`  | - Either a entity id, or a query object with field values that must match. | *Optional* |
| done |  | - Callback function providing loaded entity, if found. | &nbsp; |




##### Returns


- `Void`



#### Entity.list$([query], done) 

Load the entity. 




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| query | `object` `string` `number`  | - A query object with field values that must match, can be empty. | *Optional* |
| done |  | - Callback function providing list of matching `Entity` objects, if any. | &nbsp; |




##### Returns


- `Void`



#### Entity.remove$([query], done) 

Remove the `Entity`. 




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| query | `object` `string` `number`  | - Either a entity id, or a query object with field values that must match. | *Optional* |
| done |  | - Callback function to confirm removal. | &nbsp; |




##### Returns


- `Void`



#### Entity.fields$(error) 

Callback for Entity.remove$.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| error | `error`  | - Error object, if any. | &nbsp; |




##### Returns


- `Void`




*Documentation generated with [doxdox](https://github.com/neogeek/doxdox).*
