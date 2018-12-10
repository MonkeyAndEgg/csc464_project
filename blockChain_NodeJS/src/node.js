
const state = {
    id: 0,
    url: ""
}

export const NodeAction = {
    generate: (id, url) => {
        state.id = id;
        state.url = url;
        return { ...state }
    }
}