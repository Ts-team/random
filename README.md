# random
This random page is the page that you have to see, no one has the same page than you, she was made for you

## THREE.JS

### Load JSON object

```
  lifecycle({
    componentDidMount() {
      // Create meshes from JSON
      const meshes = [];

      const parsedModel = new ParsedModel();
      parsedModel.load('test.dae')
      .then(() => {
        parsedModel.geometries.forEach((geometry, uuid) => {
          const material = parsedModel.materialsArray[parsedModel.materialIndices.get(uuid)];
          meshes.push(
            $('mesh', { key: uuid },
              $('geometry', {
                vertices: geometry.vertices,
                faces: geometry.faces,
              }),
              createMaterial(material),
            ),
          );
        });
        this.props.setMeshes(meshes);
        console.log('meshes', meshes)
      });
    },
  }),
```
