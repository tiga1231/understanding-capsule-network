layers = ['conv1', 'conv2', 'fc1', 'fc2', 'softmax']
epochs = range(0,100)
datasets = ['mnist', 'fashion-mnist', 'cifar10']
examples = range(0,3*15)


with open('imagePreloads.css', 'w') as f:

    for dataset in datasets:
        for epoch in epochs:
            for layer in layers:
                for i in examples:
                    name = '#{}-epoch{}-{}-{}'.format(dataset, epoch, layer, i)
                    url = 'data/examples/{}/epoch{}/{}/{}.png'.format(dataset, epoch, layer, i)
                    f.write(name + '{\n')
                    f.write('\tbackground: url('+url+')\n')
                    f.write('}\n\n')
