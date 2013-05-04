use dataverse UCINow;

for $class in dataset WebSoc
    return {
        "start": $class.start ,
        "stop":$class.stop,
        "place":$class.place
    };
